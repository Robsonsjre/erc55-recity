/**
 * Hardhat Network Forking Examples
 *
 * Hardhat allows you to fork a network and run tests locally.
 * This is useful for testing against real contract state without deploying.
 */

console.log(`
═══════════════════════════════════════════════════════════════
  Hardhat Network Forking Guide
═══════════════════════════════════════════════════════════════

Hardhat's forking feature allows you to:
- Fork mainnet (or any network) at a specific block
- Run transactions locally against real state
- Test interactions with existing contracts
- Debug issues without spending gas

═══════════════════════════════════════════════════════════════
  Setup Instructions
═══════════════════════════════════════════════════════════════

1. Install Hardhat:
   npm install --save-dev hardhat

2. Create hardhat.config.js:
`)

console.log(`
// hardhat.config.js
require('@nomiclabs/hardhat-ethers')

module.exports = {
  solidity: "0.8.19",
  networks: {
    hardhat: {
      forking: {
        url: process.env.ARCHIVE_RPC_URL,
        blockNumber: 18000000  // Optional: fork from specific block
      }
    }
  }
}
`)

console.log(`
═══════════════════════════════════════════════════════════════
  Usage Examples
═══════════════════════════════════════════════════════════════

OPTION 1: Start Hardhat Node with Forking
------------------------------------------
npx hardhat node --fork \${ARCHIVE_RPC_URL}

# Or fork from specific block:
npx hardhat node --fork \${ARCHIVE_RPC_URL} --fork-block-number 18000000


OPTION 2: Use in Hardhat Tests
-------------------------------
`)

console.log(`
// test/fork-test.js
const { ethers } = require('hardhat')

describe('Forking Tests', function() {
  let usdc
  let impersonatedSigner

  before(async function() {
    // USDC contract
    usdc = await ethers.getContractAt(
      'IERC20',
      '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
    )

    // Impersonate a whale account
    const whaleAddress = '0xF977814e90dA44bFA03b6295A0616a897441aceC'
    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [whaleAddress]
    })

    impersonatedSigner = await ethers.getSigner(whaleAddress)
  })

  it('Should transfer USDC from whale', async function() {
    const recipient = '0x0000000000000000000000000000000000000001'
    const amount = ethers.utils.parseUnits('1000', 6)

    const balanceBefore = await usdc.balanceOf(recipient)

    await usdc.connect(impersonatedSigner).transfer(recipient, amount)

    const balanceAfter = await usdc.balanceOf(recipient)

    expect(balanceAfter.sub(balanceBefore)).to.equal(amount)
  })

  it('Should interact with Uniswap', async function() {
    const router = await ethers.getContractAt(
      'IUniswapV2Router',
      '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'
    )

    // Test swap without actually executing on mainnet
    const amountIn = ethers.utils.parseUnits('1000', 6)

    // Approve and swap
    await usdc.connect(impersonatedSigner).approve(router.address, amountIn)

    const path = [usdc.address, await router.WETH()]

    await router.connect(impersonatedSigner).swapExactTokensForETH(
      amountIn,
      0,
      path,
      impersonatedSigner.address,
      Date.now() + 1000
    )
  })
})
`)

console.log(`
Run tests:
npm hardhat test


OPTION 3: Interactive Console
------------------------------
npx hardhat console --network hardhat

# Then in console:
`)

console.log(`
const usdc = await ethers.getContractAt(
  'IERC20',
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
)

const balance = await usdc.balanceOf('0xF977814e90dA44bFA03b6295A0616a897441aceC')
console.log(ethers.utils.formatUnits(balance, 6))


OPTION 4: Programmatic Forking
-------------------------------
`)

console.log(`
// scripts/fork-script.js
const { ethers, network } = require('hardhat')

async function main() {
  // Fork mainnet programmatically
  await network.provider.request({
    method: 'hardhat_reset',
    params: [{
      forking: {
        jsonRpcUrl: process.env.ARCHIVE_RPC_URL,
        blockNumber: 18000000
      }
    }]
  })

  console.log('Forked mainnet at block 18000000')

  // Now interact with contracts
  const usdc = await ethers.getContractAt(
    'IERC20',
    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
  )

  const totalSupply = await usdc.totalSupply()
  console.log('USDC Total Supply:', ethers.utils.formatUnits(totalSupply, 6))

  // Impersonate account
  const whaleAddress = '0xF977814e90dA44bFA03b6295A0616a897441aceC'
  await network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [whaleAddress]
  })

  const whale = await ethers.getSigner(whaleAddress)
  const balance = await usdc.balanceOf(whale.address)
  console.log('Whale balance:', ethers.utils.formatUnits(balance, 6))

  // Stop impersonating
  await network.provider.request({
    method: 'hardhat_stopImpersonatingAccount',
    params: [whaleAddress]
  })
}

main()


═══════════════════════════════════════════════════════════════
  Advanced Features
═══════════════════════════════════════════════════════════════

1. Reset Fork to Different Block:
   await network.provider.request({
     method: 'hardhat_reset',
     params: [{
       forking: {
         jsonRpcUrl: RPC_URL,
         blockNumber: NEW_BLOCK
       }
     }]
   })

2. Mine Blocks:
   await network.provider.send('evm_mine')
   await network.provider.send('evm_increaseTime', [3600]) // +1 hour

3. Set Account Balance:
   await network.provider.send('hardhat_setBalance', [
     address,
     '0x56BC75E2D63100000' // 100 ETH
   ])

4. Get Forked Block:
   const block = await ethers.provider.getBlock('latest')
   console.log('Forked from block:', block.number)


═══════════════════════════════════════════════════════════════
  Common Use Cases
═══════════════════════════════════════════════════════════════

✅ Testing contract interactions with real protocols
✅ Debugging failed transactions
✅ Testing with real liquidity and state
✅ MEV strategy testing
✅ Integration testing without testnet deployments

❌ NOT suitable for production
❌ Slower than regular Hardhat network
❌ Requires archive node for old blocks


═══════════════════════════════════════════════════════════════
  Tips
═══════════════════════════════════════════════════════════════

• Use specific block numbers for reproducible tests
• Cache forked state to speed up repeated tests
• Impersonate accounts to test with real balances
• Fork from recent blocks to avoid archive node costs
• Use eth_call for read-only queries (faster, cheaper)


═══════════════════════════════════════════════════════════════
  Resources
═══════════════════════════════════════════════════════════════

• Hardhat Forking Docs: https://hardhat.org/hardhat-network/docs/guides/forking-other-networks
• Example Tests: https://github.com/NomicFoundation/hardhat/tree/main/packages/hardhat-core/test/internal/hardhat-network

═══════════════════════════════════════════════════════════════
`)

console.log('\nThis is an informational guide. To actually use forking:')
console.log('1. Set up a Hardhat project')
console.log('2. Configure forking in hardhat.config.js')
console.log('3. Write tests or run scripts as shown above')
