# Module 1: Event Filters

## Overview

Event filters allow you to query historical events emitted by smart contracts directly from blockchain nodes. This is the most direct way to access event logs without additional infrastructure.

## How Events Work

When smart contracts emit events, they are stored in transaction logs on the blockchain. Each event has:

- **Address**: The contract that emitted the event
- **Topics**: Indexed parameters (up to 3) + event signature
- **Data**: Non-indexed parameters (ABI-encoded)
- **Block number**: When it was emitted
- **Transaction hash**: Which transaction triggered it

### Event Signature (Topic 0)

The event signature is the keccak256 hash of the event definition:

```javascript
// For: event Transfer(address indexed from, address indexed to, uint256 value)
const eventSignature = ethers.utils.id("Transfer(address,address,uint256)")
// 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
```

### Indexed Parameters (Topics 1-3)

Up to 3 parameters can be indexed for efficient filtering:

```solidity
event Transfer(
    address indexed from,    // Topic 1
    address indexed to,      // Topic 2
    uint256 value           // Not indexed, in data field
)
```

## Using getLogs / eth_getLogs

### Basic Example

```javascript
const filter = {
    address: "0xContractAddress",
    fromBlock: 18000000,
    toBlock: 18001000,
    topics: [
        ethers.utils.id("Transfer(address,address,uint256)")
    ]
}

const logs = await provider.getLogs(filter)
```

### Filtering by Indexed Parameters

```javascript
// Get transfers FROM a specific address
const filter = {
    address: usdcAddress,
    topics: [
        ethers.utils.id("Transfer(address,address,uint256)"),
        ethers.utils.hexZeroPad(fromAddress, 32)  // Topic 1
    ]
}

// Get transfers TO a specific address
const filter = {
    address: usdcAddress,
    topics: [
        ethers.utils.id("Transfer(address,address,uint256)"),
        null,  // Any from address
        ethers.utils.hexZeroPad(toAddress, 32)  // Topic 2
    ]
}
```

## Limitations & Considerations

### 1. Block Range Limits

Most RPC providers limit the block range you can query:
- Alchemy: ~2000 blocks
- Infura: ~10000 blocks
- QuickNode: ~10000 blocks

**Solution**: Break queries into smaller chunks

### 2. Archive Nodes

Regular nodes only keep recent state. For deep historical queries, you need archive nodes:
- More expensive
- Not all providers offer them
- Alternative: use indexing services

### 3. Result Set Size

Queries returning too many events may timeout or be rejected.

**Solution**: Use more specific filters or smaller block ranges

## Performance Tips

1. **Use specific addresses**: Filter by contract address when possible
2. **Leverage indexed parameters**: Filter by topics to reduce results
3. **Paginate**: Query in smaller block ranges
4. **Cache results**: Store previously fetched logs locally
5. **Use WebSocket**: For real-time monitoring

## Code Examples

See the example files in this directory:
- [basic-filter.js](basic-filter.js) - Simple Transfer event queries
- [advanced-filter.js](advanced-filter.js) - Complex multi-contract queries with pagination

## Try It Yourself

1. Set up your `.env` file with an RPC URL
2. Run `node basic-filter.js` to see basic filtering
3. Run `node advanced-filter.js` to see advanced techniques
4. Modify the examples to query your favorite contracts

## When to Use Event Filters

✅ **Good for:**
- Recent events (last few weeks)
- Monitoring specific contracts
- Real-time event listening
- Simple queries with known parameters

❌ **Not ideal for:**
- Deep historical analysis (use Dune/The Graph)
- Complex multi-contract aggregations
- Large-scale data exports
- Queries requiring computed metrics
