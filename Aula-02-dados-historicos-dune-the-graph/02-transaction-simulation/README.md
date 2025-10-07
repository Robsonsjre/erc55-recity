# Module 2: Transaction Simulation

## Overview

Transaction simulation allows you to query the historical state of smart contracts by making read-only calls at specific block numbers. This is essential for reconstructing past balances, analyzing historical data, and understanding state changes over time.

## How It Works

The `eth_call` RPC method executes a transaction without creating an on-chain transaction. When combined with a historical block number, you can query the contract state as it existed at that point in time.

```javascript
// Query current state
const balance = await contract.balanceOf(address)

// Query historical state (at block 18000000)
const historicalBalance = await contract.balanceOf(address, {
    blockTag: 18000000
})
```

## Requirements

### Archive Nodes

To query historical state, you need access to an **archive node** that stores full state history:

| Provider | Archive Access | Cost |
|----------|----------------|------|
| Alchemy | Growth plan+ | $199+/month |
| QuickNode | Paid plans | $49+/month |
| Infura | Archive add-on | Paid |
| Self-hosted | Yes | Hardware/bandwidth costs |

Regular nodes only keep recent state (~128 blocks), so historical queries will fail.

## Common Use Cases

### 1. Historical Token Balances

Query how many tokens an address held at a specific block:

```javascript
const erc20 = new ethers.Contract(tokenAddress, erc20Abi, provider)

// Balance at specific block
const balance = await erc20.balanceOf(userAddress, {
    blockTag: blockNumber
})
```

### 2. Historical Price Queries

Get the price from a Uniswap pool at a past block:

```javascript
const pool = new ethers.Contract(poolAddress, poolAbi, provider)

const slot0 = await pool.slot0({ blockTag: blockNumber })
const sqrtPriceX96 = slot0.sqrtPriceX96

// Calculate price from sqrtPriceX96
const price = (sqrtPriceX96 / 2**96) ** 2
```

### 3. Historical Ownership

Check NFT ownership at a past block:

```javascript
const nft = new ethers.Contract(nftAddress, erc721Abi, provider)

const owner = await nft.ownerOf(tokenId, {
    blockTag: blockNumber
})
```

### 4. State Reconstruction

Reconstruct the full state of a contract at a specific time:

```javascript
// Get all relevant state variables
const [totalSupply, paused, owner] = await Promise.all([
    contract.totalSupply({ blockTag }),
    contract.paused({ blockTag }),
    contract.owner({ blockTag })
])
```

## Block Number Selection

### Getting Block by Timestamp

```javascript
// Binary search to find block closest to timestamp
async function getBlockByTimestamp(timestamp, provider) {
    const latestBlock = await provider.getBlock('latest')

    let left = 0
    let right = latestBlock.number

    while (left < right) {
        const mid = Math.floor((left + right) / 2)
        const block = await provider.getBlock(mid)

        if (block.timestamp < timestamp) {
            left = mid + 1
        } else {
            right = mid
        }
    }

    return left
}
```

### Block to Date Approximation

```javascript
// Ethereum: ~12 second blocks (before merge)
// Ethereum PoS: ~12 second blocks
// Polygon: ~2 second blocks
// BSC: ~3 second blocks

const blocksPerDay = (24 * 60 * 60) / blockTime
const blockNumber = currentBlock - (daysAgo * blocksPerDay)
```

## Network Forking

### Hardhat Forking

Fork a network at a specific block for local testing:

```javascript
// hardhat.config.js
module.exports = {
    networks: {
        hardhat: {
            forking: {
                url: process.env.ARCHIVE_RPC_URL,
                blockNumber: 18000000
            }
        }
    }
}
```

```bash
npx hardhat node --fork https://eth-mainnet.alchemyapi.io/v2/YOUR_KEY --fork-block-number 18000000
```

### Tenderly Forking

Use Tenderly for advanced simulation:

```javascript
const { TenderlySDK } = require('@tenderly/sdk')

const tenderly = new TenderlySDK({
    accessToken: process.env.TENDERLY_ACCESS_TOKEN
})

// Create a fork at specific block
const fork = await tenderly.forks.create({
    network: 'mainnet',
    blockNumber: 18000000
})
```

## Performance Considerations

### 1. Rate Limits

Archive node calls are often more expensive:
- Higher rate limit impact
- Slower response times
- Consider caching results

### 2. Batch Requests

Query multiple historical states efficiently:

```javascript
const provider = new ethers.providers.JsonRpcBatchProvider(RPC_URL)

// These will be batched into a single request
const [balance1, balance2, balance3] = await Promise.all([
    contract.balanceOf(addr1, { blockTag: block }),
    contract.balanceOf(addr2, { blockTag: block }),
    contract.balanceOf(addr3, { blockTag: block })
])
```

### 3. Multicall

Use Multicall to query multiple contracts in one call:

```javascript
const multicall = new ethers.Contract(multicallAddress, multicallAbi, provider)

const calls = [
    { target: token1, callData: token1Interface.encodeFunctionData('balanceOf', [user]) },
    { target: token2, callData: token2Interface.encodeFunctionData('balanceOf', [user]) }
]

const results = await multicall.aggregate(calls, { blockTag: blockNumber })
```

## Limitations

### Cannot Simulate State Changes

`eth_call` is read-only. You cannot:
- See what would happen if a transaction was executed
- Simulate complex transaction sequences
- Access transaction-specific data (like msg.value effects)

For these, use Tenderly's simulation API or Hardhat forking.

### Storage Proof Limits

Very old historical queries may be unavailable even on archive nodes due to:
- Pruning policies
- State rent (on some chains)
- Provider-specific limits

## Code Examples

See the example files in this directory:
- [simulate-past-state.js](simulate-past-state.js) - Historical balance and state queries
- [tenderly-example.js](tenderly-example.js) - Advanced simulation with Tenderly
- [hardhat-fork.js](hardhat-fork.js) - Local network forking

## When to Use Simulation

✅ **Good for:**
- Historical balances and ownership
- Past price queries
- State reconstruction
- "What-if" analysis with forking
- Testing against real state

❌ **Not ideal for:**
- Querying many addresses (slow, use indexers)
- Complex historical analytics (use Dune)
- Event-based queries (use getLogs)
- Real-time data (use current state or events)
