require('dotenv').config()
const { ethers } = require('ethers')

// Connect to Ethereum mainnet
const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL)

// USDC Contract on Ethereum mainnet
const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'

// Event signature for Transfer(address,address,uint256)
const TRANSFER_EVENT_SIGNATURE = ethers.utils.id('Transfer(address,address,uint256)')

console.log(`USDC Transfer Event Signature: ${TRANSFER_EVENT_SIGNATURE}`)

async function basicFilterExample() {
  console.log('=== Basic Event Filter Example ===\n')

  // Get current block
  const currentBlock = await provider.getBlockNumber()
  console.log(`Current block: ${currentBlock}\n`)

  // Query the last 1000 blocks for Transfer events
  const fromBlock = currentBlock - 1000
  const toBlock = currentBlock

  console.log(`Querying USDC Transfer events from block ${fromBlock} to ${toBlock}...\n`)

  const filter = {
    address: USDC_ADDRESS,
    fromBlock,
    toBlock,
    topics: [TRANSFER_EVENT_SIGNATURE]
  }

  const logs = await provider.getLogs(filter)

  console.log(`Found ${logs.length} Transfer events\n`)

  // Parse and display first 5 events
  const usdcInterface = new ethers.utils.Interface([
    'event Transfer(address indexed from, address indexed to, uint256 value)'
  ])

  console.log('First 5 Transfer events:\n')

  for (let i = 0; i < Math.min(5, logs.length); i++) {
    const log = logs[i]
    const parsed = usdcInterface.parseLog(log)

    // USDC has 6 decimals
    const amount = ethers.utils.formatUnits(parsed.args.value, 6)

    console.log(`Event ${i + 1}:`)
    console.log(`  Block: ${log.blockNumber}`)
    console.log(`  Tx: ${log.transactionHash}`)
    console.log(`  From: ${parsed.args.from}`)
    console.log(`  To: ${parsed.args.to}`)
    console.log(`  Amount: ${amount} USDC`)
    console.log()
  }
}

async function filterByAddress() {
  console.log('\n=== Filter by Specific Address ===\n')

  // Vitalik's address
  const VITALIK = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'

  const currentBlock = await provider.getBlockNumber()
  const fromBlock = currentBlock - 5000

  console.log(`Looking for USDC transfers TO Vitalik's address in last 5000 blocks...\n`)

  const filter = {
    address: USDC_ADDRESS,
    fromBlock,
    toBlock: 'latest',
    topics: [
      TRANSFER_EVENT_SIGNATURE,
      null, // from: any address
      ethers.utils.hexZeroPad(VITALIK, 32) // to: Vitalik
    ]
  }

  const logs = await provider.getLogs(filter)

  console.log(`Found ${logs.length} transfers to Vitalik\n`)

  if (logs.length > 0) {
    const usdcInterface = new ethers.utils.Interface([
      'event Transfer(address indexed from, address indexed to, uint256 value)'
    ])

    let totalReceived = ethers.BigNumber.from(0)

    logs.forEach((log, i) => {
      const parsed = usdcInterface.parseLog(log)
      totalReceived = totalReceived.add(parsed.args.value)

      if (i < 3) { // Show first 3
        const amount = ethers.utils.formatUnits(parsed.args.value, 6)
        console.log(`Transfer ${i + 1}:`)
        console.log(`  From: ${parsed.args.from}`)
        console.log(`  Amount: ${amount} USDC`)
        console.log()
      }
    })

    const total = ethers.utils.formatUnits(totalReceived, 6)
    console.log(`Total received in this period: ${total} USDC`)
  }
}

async function main() {
  try {
    await basicFilterExample()
    await filterByAddress()
  } catch (error) {
    console.error('Error:', error.message)
    console.error('\nMake sure you have:')
    console.error('1. Created a .env file with RPC_URL')
    console.error('2. The RPC URL is valid and accessible')
  }
}

main()
