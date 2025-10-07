/**
 * Example mapping handlers for ERC20 token subgraph
 *
 * This file shows how to:
 * - Handle Transfer events
 * - Handle Approval events
 * - Create and update entities
 * - Track statistics
 * - Handle edge cases
 */

import { BigInt, Address, Bytes } from '@graphprotocol/graph-ts'
import {
  Transfer as TransferEvent,
  Approval as ApprovalEvent,
  ERC20
} from '../generated/USDC/ERC20'
import {
  Token,
  Transfer,
  User,
  Approval,
  DailyTransferCount,
  GlobalStats
} from '../generated/schema'

// Constants
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const GLOBAL_STATS_ID = '1'

/**
 * Handle Transfer events
 *
 * This is called for every Transfer event emitted by the contract
 */
export function handleTransfer(event: TransferEvent): void {
  // Get or create token entity
  let token = getOrCreateToken(event.address)

  // Create transfer entity
  let transferId = event.transaction.hash.toHex() + '-' + event.logIndex.toString()
  let transfer = new Transfer(transferId)

  transfer.token = token.id
  transfer.from = getOrCreateUser(event.params.from, event.address).id
  transfer.to = getOrCreateUser(event.params.to, event.address).id
  transfer.value = event.params.value
  transfer.transactionHash = event.transaction.hash
  transfer.blockNumber = event.block.number
  transfer.timestamp = event.block.timestamp
  transfer.gasPrice = event.transaction.gasPrice

  transfer.save()

  // Update token statistics
  token.transferCount = token.transferCount.plus(BigInt.fromI32(1))
  token.save()

  // Update user balances
  if (event.params.from.toHex() != ZERO_ADDRESS) {
    updateUserBalance(event.params.from, event.address, event.params.value, true)
  }

  if (event.params.to.toHex() != ZERO_ADDRESS) {
    updateUserBalance(event.params.to, event.address, event.params.value, false)
  }

  // Update daily statistics
  updateDailyStats(event.address, event.block.timestamp, event.params.value)

  // Update global statistics
  updateGlobalStats(event.block.timestamp, event.block.number)
}

/**
 * Handle Approval events
 */
export function handleApproval(event: ApprovalEvent): void {
  let token = getOrCreateToken(event.address)
  let owner = getOrCreateUser(event.params.owner, event.address)

  let approvalId = event.transaction.hash.toHex() + '-' + event.logIndex.toString()
  let approval = new Approval(approvalId)

  approval.token = token.id
  approval.owner = owner.id
  approval.spender = event.params.spender
  approval.value = event.params.value
  approval.transactionHash = event.transaction.hash
  approval.blockNumber = event.block.number
  approval.timestamp = event.block.timestamp

  approval.save()
}

/**
 * Optional: Handle each block
 * Useful for tracking time-series data
 */
export function handleBlock(block: ethereum.Block): void {
  // Example: Take snapshot every N blocks
  // Implementation depends on your needs
}

/**
 * Get or create Token entity
 */
function getOrCreateToken(address: Address): Token {
  let token = Token.load(address.toHex())

  if (!token) {
    token = new Token(address.toHex())
    token.address = address

    // Fetch token details from contract
    let contract = ERC20.bind(address)

    // Try to get token details (may fail for non-standard tokens)
    let nameResult = contract.try_name()
    let symbolResult = contract.try_symbol()
    let decimalsResult = contract.try_decimals()
    let totalSupplyResult = contract.try_totalSupply()

    token.name = nameResult.reverted ? 'Unknown' : nameResult.value
    token.symbol = symbolResult.reverted ? 'UNKNOWN' : symbolResult.value
    token.decimals = decimalsResult.reverted ? 18 : decimalsResult.value
    token.totalSupply = totalSupplyResult.reverted ? BigInt.fromI32(0) : totalSupplyResult.value

    // Initialize counters
    token.transferCount = BigInt.fromI32(0)
    token.holderCount = BigInt.fromI32(0)

    // Set creation metadata
    token.createdAtTimestamp = BigInt.fromI32(0)  // Will be set on first transfer
    token.createdAtBlock = BigInt.fromI32(0)

    token.save()
  }

  return token
}

/**
 * Get or create User entity
 */
function getOrCreateUser(address: Address, tokenAddress: Address): User {
  let userId = address.toHex() + '-' + tokenAddress.toHex()
  let user = User.load(userId)

  if (!user) {
    user = new User(userId)
    user.token = tokenAddress.toHex()
    user.address = address
    user.balance = BigInt.fromI32(0)
    user.totalSent = BigInt.fromI32(0)
    user.totalReceived = BigInt.fromI32(0)
    user.transfersSentCount = BigInt.fromI32(0)
    user.transfersReceivedCount = BigInt.fromI32(0)
    user.firstSeenTimestamp = BigInt.fromI32(0)
    user.lastSeenTimestamp = BigInt.fromI32(0)
    user.firstSeenBlock = BigInt.fromI32(0)
    user.lastSeenBlock = BigInt.fromI32(0)

    // Increment holder count
    let token = Token.load(tokenAddress.toHex())
    if (token) {
      token.holderCount = token.holderCount.plus(BigInt.fromI32(1))
      token.save()
    }

    user.save()
  }

  return user
}

/**
 * Update user balance and statistics
 */
function updateUserBalance(
  address: Address,
  tokenAddress: Address,
  value: BigInt,
  isSending: boolean
): void {
  let user = getOrCreateUser(address, tokenAddress)

  if (isSending) {
    user.balance = user.balance.minus(value)
    user.totalSent = user.totalSent.plus(value)
    user.transfersSentCount = user.transfersSentCount.plus(BigInt.fromI32(1))
  } else {
    user.balance = user.balance.plus(value)
    user.totalReceived = user.totalReceived.plus(value)
    user.transfersReceivedCount = user.transfersReceivedCount.plus(BigInt.fromI32(1))
  }

  // Update timestamps
  if (user.firstSeenTimestamp.equals(BigInt.fromI32(0))) {
    user.firstSeenTimestamp = block.timestamp
    user.firstSeenBlock = block.number
  }
  user.lastSeenTimestamp = block.timestamp
  user.lastSeenBlock = block.number

  user.save()

  // Remove from holder count if balance is now zero
  if (user.balance.equals(BigInt.fromI32(0))) {
    let token = Token.load(tokenAddress.toHex())
    if (token) {
      token.holderCount = token.holderCount.minus(BigInt.fromI32(1))
      token.save()
    }
  }
}

/**
 * Update daily transfer statistics
 */
function updateDailyStats(
  tokenAddress: Address,
  timestamp: BigInt,
  volume: BigInt
): void {
  // Calculate day ID (timestamp / 86400)
  let dayId = timestamp.toI32() / 86400
  let statsId = tokenAddress.toHex() + '-' + dayId.toString()

  let stats = DailyTransferCount.load(statsId)

  if (!stats) {
    stats = new DailyTransferCount(statsId)
    stats.token = tokenAddress.toHex()
    stats.date = dayId * 86400
    stats.count = BigInt.fromI32(0)
    stats.volume = BigInt.fromI32(0)
    stats.uniqueSenders = BigInt.fromI32(0)
    stats.uniqueReceivers = BigInt.fromI32(0)
  }

  stats.count = stats.count.plus(BigInt.fromI32(1))
  stats.volume = stats.volume.plus(volume)
  stats.save()
}

/**
 * Update global statistics
 */
function updateGlobalStats(timestamp: BigInt, blockNumber: BigInt): void {
  let stats = GlobalStats.load(GLOBAL_STATS_ID)

  if (!stats) {
    stats = new GlobalStats(GLOBAL_STATS_ID)
    stats.totalTokens = BigInt.fromI32(0)
    stats.totalTransfers = BigInt.fromI32(0)
    stats.totalUsers = BigInt.fromI32(0)
    stats.lastUpdateTimestamp = BigInt.fromI32(0)
    stats.lastUpdateBlock = BigInt.fromI32(0)
  }

  stats.totalTransfers = stats.totalTransfers.plus(BigInt.fromI32(1))
  stats.lastUpdateTimestamp = timestamp
  stats.lastUpdateBlock = blockNumber
  stats.save()
}

/**
 * Helper: Check if address is zero address
 */
function isZeroAddress(address: Address): boolean {
  return address.toHex() == ZERO_ADDRESS
}
