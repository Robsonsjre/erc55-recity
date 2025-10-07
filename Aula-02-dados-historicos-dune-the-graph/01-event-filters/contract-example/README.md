# Sample Token Contract

This directory contains a simple ERC20-like token contract for demonstrating event filtering concepts.

## Events Demonstrated

### 1. Standard Transfer Event
```solidity
event Transfer(address indexed from, address indexed to, uint256 value)
```
- 2 indexed parameters (can filter by from/to address)
- Standard ERC20 event format

### 2. Approval Event
```solidity
event Approval(address indexed owner, address indexed spender, uint256 value)
```
- 2 indexed parameters

### 3. LargeTransfer Event
```solidity
event LargeTransfer(
    address indexed from,
    address indexed to,
    uint256 indexed tier,
    uint256 amount,
    uint256 timestamp
)
```
- 3 indexed parameters (maximum allowed in Solidity)
- Shows how to use all available indexed slots
- Non-indexed data (amount, timestamp) stored in data field

### 4. TokensBurned Event
```solidity
event TokensBurned(address burner, uint256 amount, string reason)
```
- No indexed parameters
- All data in data field (requires parsing entire event)

## Deployment

You can deploy this contract to test networks:

### Using Remix
1. Copy `SampleToken.sol` to Remix IDE
2. Compile with Solidity 0.8.0+
3. Deploy to Sepolia or your preferred testnet
4. Interact and generate events

### Using Hardhat
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

## Testing Event Filters

After deploying:

1. Make some transfers to generate Transfer events
2. Make large transfers (>100 tokens) to generate LargeTransfer events
3. Burn tokens to generate TokensBurned events
4. Use the examples in the parent directory to query these events

## Example Queries

```javascript
// Get all transfers
const transferFilter = {
    address: contractAddress,
    topics: [ethers.utils.id("Transfer(address,address,uint256)")]
}

// Get transfers FROM a specific address
const fromFilter = {
    address: contractAddress,
    topics: [
        ethers.utils.id("Transfer(address,address,uint256)"),
        ethers.utils.hexZeroPad(fromAddress, 32)
    ]
}

// Get only tier 3 large transfers (10000+ tokens)
const tier3Filter = {
    address: contractAddress,
    topics: [
        ethers.utils.id("LargeTransfer(address,address,uint256,uint256,uint256)"),
        null, // any from
        null, // any to
        ethers.utils.hexZeroPad(3, 32) // tier 3
    ]
}
```

## Learning Objectives

This contract demonstrates:
- How indexed vs non-indexed parameters affect filtering
- The 3-indexed-parameter maximum
- How to design events for efficient querying
- Trade-offs between indexed parameters and gas costs
