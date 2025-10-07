require('dotenv').config()
const { ethers } = require('ethers')

// Requires an ARCHIVE node RPC URL
const provider = new ethers.providers.JsonRpcProvider(process.env.ARCHIVE_RPC_URL || process.env.RPC_URL)

// USDC Contract
const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const USDC_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function decimals() view returns (uint8)'
]

// Vitalik's address
const VITALIK = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'

/**
 * Example 1: Query historical balance
 */
async function historicalBalance() {
  console.log('=== Historical Balance Example ===\n')

  const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, provider)

  const currentBlock = await provider.getBlockNumber()
  console.log(`Current block: ${currentBlock}`)

  // Query balance at different points in time
  const blocks = [
    currentBlock,
    currentBlock - 10000,   // ~1.4 days ago
    currentBlock - 100000,  // ~14 days ago
  ]

  console.log(`\nVitalik's USDC balance over time:\n`)

  for (const block of blocks) {
    try {
      const balance = await usdc.balanceOf(VITALIK, { blockTag: block })
      const formatted = ethers.utils.formatUnits(balance, 6)

      const blockInfo = await provider.getBlock(block)
      const date = new Date(blockInfo.timestamp * 1000)

      console.log(`Block ${block} (${date.toISOString()}):`)
      console.log(`  Balance: ${formatted} USDC\n`)
    } catch (error) {
      console.log(`Block ${block}: Error - ${error.message}`)
      console.log('  (This block may be too old for your RPC provider)\n')
    }
  }
}

/**
 * Example 2: Compare multiple addresses at same block
 */
async function compareBalances() {
  console.log('=== Compare Multiple Addresses ===\n')

  const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, provider)

  const addresses = [
    { name: 'Vitalik', address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' },
    { name: 'Binance Hot Wallet', address: '0xF977814e90dA44bFA03b6295A0616a897441aceC' },
    { name: 'Coinbase', address: '0x71660c4005BA85c37ccec55d0C4493E66Fe775d3' },
  ]

  const currentBlock = await provider.getBlockNumber()
  const historicalBlock = currentBlock - 50000 // ~7 days ago

  console.log(`Comparing USDC balances at block ${historicalBlock}:\n`)

  for (const { name, address } of addresses) {
    try {
      const balance = await usdc.balanceOf(address, { blockTag: historicalBlock })
      const formatted = ethers.utils.formatUnits(balance, 6)

      console.log(`${name}:`)
      console.log(`  ${formatted} USDC`)
      console.log()
    } catch (error) {
      console.log(`${name}: Error - ${error.message}\n`)
    }
  }
}

/**
 * Example 3: Track balance changes over time
 */
async function trackBalanceChanges() {
  console.log('=== Track Balance Changes Over Time ===\n')

  const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, provider)

  const currentBlock = await provider.getBlockNumber()
  const numSnapshots = 5
  const blockInterval = 20000

  console.log(`Tracking USDC total supply over ${numSnapshots} snapshots:\n`)

  const snapshots = []

  for (let i = numSnapshots - 1; i >= 0; i--) {
    const block = currentBlock - (i * blockInterval)

    try {
      const totalSupply = await usdc.totalSupply({ blockTag: block })
      const blockInfo = await provider.getBlock(block)

      snapshots.push({
        block,
        timestamp: blockInfo.timestamp,
        totalSupply
      })
    } catch (error) {
      console.log(`Block ${block}: Error - ${error.message}`)
    }
  }

  // Display snapshots with changes
  for (let i = 0; i < snapshots.length; i++) {
    const snapshot = snapshots[i]
    const formatted = ethers.utils.formatUnits(snapshot.totalSupply, 6)
    const date = new Date(snapshot.timestamp * 1000).toISOString()

    console.log(`Snapshot ${i + 1}:`)
    console.log(`  Block: ${snapshot.block}`)
    console.log(`  Date: ${date}`)
    console.log(`  Total Supply: ${formatted} USDC`)

    if (i > 0) {
      const change = snapshot.totalSupply.sub(snapshots[i - 1].totalSupply)
      const changeFormatted = ethers.utils.formatUnits(change, 6)
      const changePercent = change.mul(10000).div(snapshots[i - 1].totalSupply).toNumber() / 100

      console.log(`  Change: ${changeFormatted} USDC (${changePercent.toFixed(2)}%)`)
    }
    console.log()
  }
}

/**
 * Example 4: Find block by approximate timestamp
 */
async function findBlockByTimestamp(targetTimestamp) {
  console.log('=== Find Block by Timestamp ===\n')

  const targetDate = new Date(targetTimestamp * 1000)
  console.log(`Target date: ${targetDate.toISOString()}`)
  console.log('Searching for closest block...\n')

  const latestBlock = await provider.getBlock('latest')

  // Binary search
  let left = 0
  let right = latestBlock.number
  let closestBlock = null

  while (left <= right) {
    const mid = Math.floor((left + right) / 2)
    const block = await provider.getBlock(mid)

    if (Math.abs(block.timestamp - targetTimestamp) < 15) {
      // Within 15 seconds is close enough
      closestBlock = block
      break
    }

    if (block.timestamp < targetTimestamp) {
      left = mid + 1
    } else {
      right = mid - 1
    }

    // Keep track of closest
    if (!closestBlock || Math.abs(block.timestamp - targetTimestamp) < Math.abs(closestBlock.timestamp - targetTimestamp)) {
      closestBlock = block
    }
  }

  if (closestBlock) {
    const actualDate = new Date(closestBlock.timestamp * 1000)
    const diff = Math.abs(closestBlock.timestamp - targetTimestamp)

    console.log('Found closest block:')
    console.log(`  Block Number: ${closestBlock.number}`)
    console.log(`  Date: ${actualDate.toISOString()}`)
    console.log(`  Time difference: ${diff} seconds`)
  }

  return closestBlock
}

/**
 * Example 5: Batch historical queries
 */
async function batchHistoricalQueries() {
  console.log('\n=== Batch Historical Queries ===\n')

  const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, provider)

  const addresses = [
    '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', // Vitalik
    '0xF977814e90dA44bFA03b6295A0616a897441aceC', // Binance
    '0x71660c4005BA85c37ccec55d0C4493E66Fe775d3', // Coinbase
  ]

  const currentBlock = await provider.getBlockNumber()
  const historicalBlock = currentBlock - 10000

  console.log(`Querying ${addresses.length} addresses at block ${historicalBlock}...\n`)

  const startTime = Date.now()

  // Execute all queries in parallel
  const balances = await Promise.all(
    addresses.map(addr => usdc.balanceOf(addr, { blockTag: historicalBlock }))
  )

  const duration = Date.now() - startTime

  console.log('Results:')
  addresses.forEach((addr, i) => {
    const formatted = ethers.utils.formatUnits(balances[i], 6)
    console.log(`  ${addr}: ${formatted} USDC`)
  })

  console.log(`\nTotal time: ${duration}ms`)
  console.log(`Average per query: ${(duration / addresses.length).toFixed(0)}ms`)
}

async function main() {
  try {
    console.log('Note: This script requires an ARCHIVE node RPC URL\n')
    console.log('If you see errors, your RPC provider may not support historical queries.\n')
    console.log('='.repeat(60) + '\n')

    await historicalBalance()
    await compareBalances()
    await trackBalanceChanges()

    // Find block from 7 days ago
    const sevenDaysAgo = Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60)
    await findBlockByTimestamp(sevenDaysAgo)

    await batchHistoricalQueries()

    console.log('\n=== All Examples Complete ===')
  } catch (error) {
    console.error('Error:', error.message)
    console.error('\nMake sure you have:')
    console.error('1. ARCHIVE_RPC_URL configured in .env')
    console.error('2. Access to an archive node (regular nodes won\'t work)')
    console.error('3. Valid API credentials')
  }
}

main()
