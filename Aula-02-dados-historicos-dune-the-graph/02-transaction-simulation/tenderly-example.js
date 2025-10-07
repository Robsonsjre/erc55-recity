require('dotenv').config()
const axios = require('axios')
const { ethers } = require('ethers')

/**
 * Tenderly provides advanced simulation and debugging capabilities
 * https://docs.tenderly.co/
 */

const TENDERLY_USER = process.env.TENDERLY_USER
const TENDERLY_PROJECT = process.env.TENDERLY_PROJECT
const TENDERLY_ACCESS_KEY = process.env.TENDERLY_ACCESS_KEY

const TENDERLY_API_BASE = 'https://api.tenderly.co/api/v1'

/**
 * Example 1: Simulate a transaction
 */
async function simulateTransaction() {
  console.log('=== Simulate Transaction with Tenderly ===\n')

  if (!TENDERLY_ACCESS_KEY) {
    console.log('TENDERLY_ACCESS_KEY not configured. Skipping this example.')
    console.log('Get your access key from: https://dashboard.tenderly.co/account/authorization\n')
    return
  }

  // Simulate a USDC transfer
  const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
  const VITALIK = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'

  // ERC20 transfer function signature
  const transferData = ethers.utils.defaultAbiCoder.encode(
    ['address', 'uint256'],
    ['0x0000000000000000000000000000000000000001', ethers.utils.parseUnits('100', 6)]
  )

  const simulationPayload = {
    network_id: '1', // Ethereum mainnet
    from: VITALIK,
    to: USDC_ADDRESS,
    input: '0xa9059cbb' + transferData.slice(2), // transfer(address,uint256)
    gas: 100000,
    gas_price: '0',
    value: '0',
    save: true, // Save simulation for later viewing
    save_if_fails: true
  }

  try {
    const response = await axios.post(
      `${TENDERLY_API_BASE}/account/${TENDERLY_USER}/project/${TENDERLY_PROJECT}/simulate`,
      simulationPayload,
      {
        headers: {
          'X-Access-Key': TENDERLY_ACCESS_KEY,
          'Content-Type': 'application/json'
        }
      }
    )

    const simulation = response.data.simulation

    console.log('Simulation successful!')
    console.log(`\nSimulation ID: ${simulation.id}`)
    console.log(`Status: ${simulation.status ? 'Success' : 'Failed'}`)
    console.log(`Gas used: ${simulation.gas_used}`)
    console.log(`\nView in dashboard:`)
    console.log(`https://dashboard.tenderly.co/${TENDERLY_USER}/${TENDERLY_PROJECT}/simulator/${simulation.id}`)

    // Show state changes
    if (simulation.transaction_info?.state_diff) {
      console.log('\nState changes detected:')
      const stateDiff = simulation.transaction_info.state_diff
      console.log(`  ${Object.keys(stateDiff).length} contract(s) affected`)
    }

  } catch (error) {
    console.error('Simulation failed:', error.response?.data || error.message)
  }
}

/**
 * Example 2: Simulate at historical block
 */
async function simulateAtHistoricalBlock() {
  console.log('\n=== Simulate at Historical Block ===\n')

  if (!TENDERLY_ACCESS_KEY) {
    console.log('Skipping - TENDERLY_ACCESS_KEY not configured.\n')
    return
  }

  // Simulate what a transaction would have looked like 1 million blocks ago
  const simulationPayload = {
    network_id: '1',
    block_number: 18000000, // Specific historical block
    from: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    to: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    input: '0x70a08231000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045', // balanceOf
    gas: 100000,
    gas_price: '0',
    value: '0'
  }

  try {
    const response = await axios.post(
      `${TENDERLY_API_BASE}/account/${TENDERLY_USER}/project/${TENDERLY_PROJECT}/simulate`,
      simulationPayload,
      {
        headers: {
          'X-Access-Key': TENDERLY_ACCESS_KEY
        }
      }
    )

    console.log('Historical simulation successful!')
    console.log(`Block: ${simulationPayload.block_number}`)
    console.log(`Gas used: ${response.data.simulation.gas_used}`)

  } catch (error) {
    console.error('Error:', error.response?.data || error.message)
  }
}

/**
 * Example 3: Create a fork for testing
 */
async function createFork() {
  console.log('\n=== Create Tenderly Fork ===\n')

  if (!TENDERLY_ACCESS_KEY) {
    console.log('Skipping - TENDERLY_ACCESS_KEY not configured.\n')
    return
  }

  const forkPayload = {
    network_id: '1',
    block_number: 18000000, // Fork from this block
    chain_config: {
      chain_id: 1
    }
  }

  try {
    const response = await axios.post(
      `${TENDERLY_API_BASE}/account/${TENDERLY_USER}/project/${TENDERLY_PROJECT}/fork`,
      forkPayload,
      {
        headers: {
          'X-Access-Key': TENDERLY_ACCESS_KEY
        }
      }
    )

    const fork = response.data.simulation_fork

    console.log('Fork created successfully!')
    console.log(`\nFork ID: ${fork.id}`)
    console.log(`RPC URL: ${fork.rpc_url}`)
    console.log(`\nYou can now use this RPC URL in your code:`)
    console.log(`const provider = new ethers.providers.JsonRpcProvider('${fork.rpc_url}')`)

    console.log('\nExample: Send a transaction to the fork')
    console.log(`
const provider = new ethers.providers.JsonRpcProvider('${fork.rpc_url}')
const wallet = new ethers.Wallet(privateKey, provider)

// This transaction will execute on the fork
const tx = await wallet.sendTransaction({
  to: recipientAddress,
  value: ethers.utils.parseEther('1.0')
})
`)

    return fork

  } catch (error) {
    console.error('Error creating fork:', error.response?.data || error.message)
  }
}

/**
 * Example 4: Simulate bundle (multiple transactions)
 */
async function simulateBundle() {
  console.log('\n=== Simulate Transaction Bundle ===\n')

  if (!TENDERLY_ACCESS_KEY) {
    console.log('Skipping - TENDERLY_ACCESS_KEY not configured.\n')
    return
  }

  const bundlePayload = {
    network_id: '1',
    block_number: null, // Latest block
    transactions: [
      {
        from: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        to: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        input: '0x70a08231000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045',
        gas: 100000,
        gas_price: '0',
        value: '0'
      },
      {
        from: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        to: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        input: '0x18160ddd', // totalSupply()
        gas: 100000,
        gas_price: '0',
        value: '0'
      }
    ]
  }

  try {
    const response = await axios.post(
      `${TENDERLY_API_BASE}/account/${TENDERLY_USER}/project/${TENDERLY_PROJECT}/simulate-bundle`,
      bundlePayload,
      {
        headers: {
          'X-Access-Key': TENDERLY_ACCESS_KEY
        }
      }
    )

    console.log('Bundle simulation successful!')
    console.log(`\nSimulated ${response.data.simulation_results.length} transactions`)

    response.data.simulation_results.forEach((result, i) => {
      console.log(`\nTransaction ${i + 1}:`)
      console.log(`  Status: ${result.simulation.status ? 'Success' : 'Failed'}`)
      console.log(`  Gas used: ${result.simulation.gas_used}`)
    })

  } catch (error) {
    console.error('Error:', error.response?.data || error.message)
  }
}

/**
 * Example 5: Use a fork with ethers.js
 */
async function useForkWithEthers() {
  console.log('\n=== Using Fork with ethers.js ===\n')

  if (!TENDERLY_ACCESS_KEY) {
    console.log('Skipping - TENDERLY_ACCESS_KEY not configured.\n')
    return
  }

  // First create a fork
  const fork = await createFork()

  if (!fork) return

  console.log('\nConnecting to fork with ethers.js...')

  const provider = new ethers.providers.JsonRpcProvider(fork.rpc_url)

  // Query state from the fork
  const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
  const USDC_ABI = ['function balanceOf(address) view returns (uint256)']

  const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, provider)

  const balance = await usdc.balanceOf('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045')

  console.log(`\nQueried balance from fork: ${ethers.utils.formatUnits(balance, 6)} USDC`)

  console.log('\nYou can now:')
  console.log('- Send transactions to this fork')
  console.log('- Test contract interactions')
  console.log('- Debug without affecting mainnet')
  console.log('- Share the fork with your team')
}

async function main() {
  try {
    console.log('Tenderly Simulation Examples\n')
    console.log('Tenderly provides:')
    console.log('- Transaction simulation without gas costs')
    console.log('- Historical block simulation')
    console.log('- Network forking for testing')
    console.log('- Detailed debugging and state inspection')
    console.log('- Gas profiling\n')
    console.log('='.repeat(60) + '\n')

    await simulateTransaction()
    await simulateAtHistoricalBlock()
    await simulateBundle()
    await useForkWithEthers()

    console.log('\n=== Examples Complete ===')
    console.log('\nTo use Tenderly:')
    console.log('1. Sign up at https://tenderly.co/')
    console.log('2. Create a project')
    console.log('3. Get your access key from Account Settings')
    console.log('4. Add to .env: TENDERLY_USER, TENDERLY_PROJECT, TENDERLY_ACCESS_KEY')

  } catch (error) {
    console.error('Error:', error.message)
  }
}

main()
