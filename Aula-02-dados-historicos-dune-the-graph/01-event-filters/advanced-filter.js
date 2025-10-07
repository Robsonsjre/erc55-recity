require('dotenv').config()
const { ethers } = require('ethers')

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL)

// Uniswap V3 USDC/ETH Pool
const POOL_ADDRESS = '0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640'

// Event signatures
const SWAP_EVENT = ethers.utils.id('Swap(address,address,int256,int256,uint160,uint128,int24)')

/**
 * Example 1: Pagination for large block ranges
 * Break down queries into chunks to avoid RPC limits
 */
async function paginatedQuery() {
  console.log('=== Paginated Query Example ===\n')

  const currentBlock = await provider.getBlockNumber()
  const startBlock = currentBlock - 10000
  const endBlock = currentBlock
  const chunkSize = 2000 // Most providers support 2000 blocks

  console.log(`Querying ${endBlock - startBlock} blocks in chunks of ${chunkSize}...\n`)

  let allLogs = []

  for (let from = startBlock; from < endBlock; from += chunkSize) {
    const to = Math.min(from + chunkSize - 1, endBlock)

    console.log(`Fetching blocks ${from} to ${to}...`)

    const logs = await provider.getLogs({
      address: POOL_ADDRESS,
      fromBlock: from,
      toBlock: to,
      topics: [SWAP_EVENT]
    })

    allLogs = allLogs.concat(logs)

    // Respect rate limits
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  console.log(`\nTotal Swap events found: ${allLogs.length}`)

  return allLogs
}

/**
 * Example 2: Multi-contract query
 * Query events from multiple contracts efficiently
 */
async function multiContractQuery() {
  console.log('\n=== Multi-Contract Query Example ===\n')

  // Multiple DEX pools
  const pools = [
    '0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640', // Uniswap V3 USDC/ETH
    '0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8', // Uniswap V3 USDC/ETH (0.3%)
  ]

  const currentBlock = await provider.getBlockNumber()
  const fromBlock = currentBlock - 1000

  console.log(`Querying swap events from ${pools.length} pools...\n`)

  // Query all pools in parallel
  const promises = pools.map(address =>
    provider.getLogs({
      address,
      fromBlock,
      toBlock: 'latest',
      topics: [SWAP_EVENT]
    })
  )

  const results = await Promise.all(promises)

  pools.forEach((pool, i) => {
    console.log(`Pool ${pool.slice(0, 10)}...: ${results[i].length} swaps`)
  })

  const totalSwaps = results.reduce((sum, logs) => sum + logs.length, 0)
  console.log(`\nTotal swaps across all pools: ${totalSwaps}`)
}

/**
 * Example 3: Complex filtering with decoded data
 * Parse events and filter by decoded values
 */
async function complexFiltering() {
  console.log('\n=== Complex Filtering Example ===\n')

  const currentBlock = await provider.getBlockNumber()

  console.log('Fetching recent swaps from Uniswap V3 pool...\n')

  const logs = await provider.getLogs({
    address: POOL_ADDRESS,
    fromBlock: currentBlock - 500,
    toBlock: 'latest',
    topics: [SWAP_EVENT]
  })

  // Interface for parsing
  const poolInterface = new ethers.utils.Interface([
    'event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)'
  ])

  console.log(`Found ${logs.length} swaps, filtering for large trades...\n`)

  // Filter for large swaps (>1000 USDC value)
  const largeSwaps = logs
    .map(log => {
      const parsed = poolInterface.parseLog(log)
      return {
        blockNumber: log.blockNumber,
        txHash: log.transactionHash,
        sender: parsed.args.sender,
        recipient: parsed.args.recipient,
        amount0: parsed.args.amount0,
        amount1: parsed.args.amount1,
        sqrtPriceX96: parsed.args.sqrtPriceX96,
      }
    })
    .filter(swap => {
      // amount1 is USDC (6 decimals)
      const usdcAmount = Math.abs(ethers.utils.formatUnits(swap.amount1, 6))
      return parseFloat(usdcAmount) > 1000
    })

  console.log(`Found ${largeSwaps.length} swaps > 1000 USDC\n`)

  // Display first 5
  largeSwaps.slice(0, 5).forEach((swap, i) => {
    const ethAmount = ethers.utils.formatEther(swap.amount0.abs())
    const usdcAmount = ethers.utils.formatUnits(swap.amount1.abs(), 6)

    console.log(`Large Swap ${i + 1}:`)
    console.log(`  Block: ${swap.blockNumber}`)
    console.log(`  Tx: ${swap.txHash}`)
    console.log(`  ETH amount: ${ethAmount}`)
    console.log(`  USDC amount: ${usdcAmount}`)
    console.log()
  })
}

/**
 * Example 4: Real-time monitoring with WebSocket
 * Note: This requires a WebSocket RPC endpoint
 */
async function realtimeMonitoring() {
  console.log('\n=== Real-time Monitoring Example ===\n')

  if (!process.env.WS_RPC_URL) {
    console.log('WebSocket RPC URL not configured. Skipping this example.')
    console.log('Add WS_RPC_URL to .env to enable real-time monitoring.\n')
    return
  }

  const wsProvider = new ethers.providers.WebSocketProvider(process.env.WS_RPC_URL)

  const filter = {
    address: POOL_ADDRESS,
    topics: [SWAP_EVENT]
  }

  console.log('Listening for swaps... (will run for 30 seconds)\n')

  wsProvider.on(filter, (log) => {
    console.log(`New swap detected in block ${log.blockNumber}`)
    console.log(`  Tx: ${log.transactionHash}`)
  })

  // Run for 30 seconds then cleanup
  await new Promise(resolve => setTimeout(resolve, 30000))

  wsProvider.removeAllListeners()
  await wsProvider.destroy()

  console.log('\nStopped monitoring.')
}

async function main() {
  try {
    await paginatedQuery()
    await multiContractQuery()
    await complexFiltering()
    await realtimeMonitoring()

    console.log('\n=== All Examples Complete ===')
  } catch (error) {
    console.error('Error:', error.message)
    console.error('\nMake sure you have:')
    console.error('1. Created a .env file with RPC_URL')
    console.error('2. The RPC URL is valid and accessible')
    console.error('3. (Optional) WS_RPC_URL for WebSocket examples')
  }
}

main()
