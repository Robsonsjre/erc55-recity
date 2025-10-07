# The Graph

## Overview

The Graph is a decentralized indexing protocol that allows you to create custom subgraphs to index blockchain data exactly as you need it. Unlike Dune's pre-indexed database, The Graph lets you define your own schema and indexing logic.

## Why Use The Graph?

✅ **Custom Indexing**: Define exactly what data you need
✅ **GraphQL API**: Query with flexible GraphQL syntax
✅ **Real-time**: Near real-time data (seconds delay)
✅ **Decentralized**: Hosted on decentralized infrastructure
✅ **Production-Ready**: Powers major dApps (Uniswap, Aave, etc.)
✅ **Multiple Chains**: Support for many EVM and non-EVM chains

## Key Concepts

### Subgraph

A subgraph defines:
1. **Schema** - Data structure (entities and their fields)
2. **Data Sources** - Which contracts to index
3. **Mappings** - How to transform events into entities

### Components

```
subgraph.yaml          → Configuration (contracts, events, handlers)
schema.graphql         → Data model (entities)
mappings/
  └── contract.ts      → Event handlers (indexing logic)
```

## Getting Started

### 1. Install Graph CLI

```bash
npm install -g @graphprotocol/graph-cli
```

### 2. Initialize Subgraph

```bash
graph init --product subgraph-studio my-subgraph
```

Or for a specific contract:

```bash
graph init \
  --product subgraph-studio \
  --from-contract 0xYourContractAddress \
  my-subgraph
```

### 3. Define Schema

Edit `schema.graphql`:

```graphql
type Transfer @entity {
  id: ID!
  from: Bytes!
  to: Bytes!
  value: BigInt!
  timestamp: BigInt!
  blockNumber: BigInt!
  transactionHash: Bytes!
}

type User @entity {
  id: ID!
  address: Bytes!
  totalSent: BigInt!
  totalReceived: BigInt!
  transfersSent: [Transfer!]! @derivedFrom(field: "from")
  transfersReceived: [Transfer!]! @derivedFrom(field: "to")
}
```

### 4. Configure Data Sources

Edit `subgraph.yaml`:

```yaml
specVersion: 0.0.5
schema:
  file: ./schema.graphql
dataSources:
  - kind: ethereum
    name: Token
    network: mainnet
    source:
      address: "0xYourTokenAddress"
      abi: ERC20
      startBlock: 18000000
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      entities:
        - Transfer
        - User
      abis:
        - name: ERC20
          file: ./abis/ERC20.json
      eventHandlers:
        - event: Transfer(indexed address,indexed address,uint256)
          handler: handleTransfer
      file: ./mappings/token.ts
```

### 5. Write Mapping Handlers

Create `mappings/token.ts`:

```typescript
import { Transfer as TransferEvent } from '../generated/Token/ERC20'
import { Transfer, User } from '../generated/schema'

export function handleTransfer(event: TransferEvent): void {
  // Create Transfer entity
  let transfer = new Transfer(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString()
  )
  transfer.from = event.params.from
  transfer.to = event.params.to
  transfer.value = event.params.value
  transfer.timestamp = event.block.timestamp
  transfer.blockNumber = event.block.number
  transfer.transactionHash = event.transaction.hash
  transfer.save()

  // Update or create User entities
  updateUser(event.params.from, event.params.value, true)
  updateUser(event.params.to, event.params.value, false)
}

function updateUser(address: Bytes, value: BigInt, isSending: boolean): void {
  let user = User.load(address.toHex())

  if (!user) {
    user = new User(address.toHex())
    user.address = address
    user.totalSent = BigInt.fromI32(0)
    user.totalReceived = BigInt.fromI32(0)
  }

  if (isSending) {
    user.totalSent = user.totalSent.plus(value)
  } else {
    user.totalReceived = user.totalReceived.plus(value)
  }

  user.save()
}
```

### 6. Generate Code

```bash
graph codegen
```

This generates TypeScript types from your schema and ABIs.

### 7. Build

```bash
graph build
```

### 8. Deploy

#### Option A: Subgraph Studio (Decentralized Network)

```bash
graph auth --studio YOUR_DEPLOY_KEY
graph deploy --studio my-subgraph
```

#### Option B: Hosted Service (Deprecated, but still available)

```bash
graph auth --product hosted-service YOUR_ACCESS_TOKEN
graph deploy --product hosted-service YOUR_GITHUB_USERNAME/my-subgraph
```

## Querying Your Subgraph

Once deployed, you get a GraphQL endpoint. Query it:

### Basic Queries

```graphql
{
  transfers(first: 10, orderBy: timestamp, orderDirection: desc) {
    id
    from
    to
    value
    timestamp
  }
}
```

### Filtered Queries

```graphql
{
  transfers(
    where: {
      value_gt: "1000000000000000000"  # > 1 ETH
      timestamp_gt: 1640000000
    }
    orderBy: value
    orderDirection: desc
  ) {
    from
    to
    value
    transactionHash
  }
}
```

### Aggregated Data

```graphql
{
  users(
    first: 10
    orderBy: totalReceived
    orderDirection: desc
  ) {
    id
    address
    totalSent
    totalReceived
    transfersReceived(first: 5) {
      value
      timestamp
    }
  }
}
```

### Pagination

```graphql
{
  transfers(
    first: 100
    skip: 0
    orderBy: timestamp
    orderDirection: desc
  ) {
    id
    timestamp
  }
}
```

## Using GraphQL in JavaScript

```javascript
const axios = require('axios')

const SUBGRAPH_URL = 'https://api.studio.thegraph.com/query/YOUR_SUBGRAPH_ID'

async function querySubgraph() {
  const query = `
    {
      transfers(first: 10) {
        from
        to
        value
      }
    }
  `

  const response = await axios.post(SUBGRAPH_URL, {
    query
  })

  return response.data.data
}
```

See [query-examples.js](query-examples.js) for complete examples.

## Advanced Features

### 1. Full-Text Search

Define in schema:

```graphql
type User @entity {
  id: ID!
  name: String! @fulltext(name: "userSearch", fields: ["name"])
}
```

Query:

```graphql
{
  userSearch(text: "vitalik") {
    id
    name
  }
}
```

### 2. Time-Travel Queries

Query historical state:

```graphql
{
  users(block: { number: 18000000 }) {
    id
    totalReceived
  }
}
```

### 3. Template Data Sources

Dynamically create data sources (e.g., for factory contracts):

```yaml
templates:
  - kind: ethereum/contract
    name: Pair
    network: mainnet
    source:
      abi: Pair
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      file: ./mappings/pair.ts
      entities:
        - Pair
      abis:
        - name: Pair
          file: ./abis/Pair.json
      eventHandlers:
        - event: Swap(indexed address,uint256,uint256,uint256,uint256,indexed address)
          handler: handleSwap
```

Create in mapping:

```typescript
import { PairCreated } from '../generated/Factory/Factory'
import { Pair as PairTemplate } from '../generated/templates'

export function handlePairCreated(event: PairCreated): void {
  // Start indexing the new pair
  PairTemplate.create(event.params.pair)
}
```

### 4. IPFS Integration

Store and query IPFS data:

```typescript
import { ipfs, json } from '@graphprotocol/graph-ts'

let data = ipfs.cat(hash)
if (data) {
  let value = json.fromBytes(data).toObject()
  // Process IPFS data
}
```

### 5. Multiple Data Sources

Index multiple contracts:

```yaml
dataSources:
  - kind: ethereum
    name: USDC
    source:
      address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
      abi: ERC20
    mapping:
      # ...
  - kind: ethereum
    name: USDT
    source:
      address: "0xdAC17F958D2ee523a2206206994597C13D831ec7"
      abi: ERC20
    mapping:
      # ...
```

## Best Practices

### 1. Use Derived Fields

Instead of storing duplicate data:

```graphql
type User @entity {
  id: ID!
  transfers: [Transfer!]! @derivedFrom(field: "from")
}

type Transfer @entity {
  id: ID!
  from: User!
  # ...
}
```

### 2. Efficient IDs

Use composite keys for unique entities:

```typescript
let id = event.transaction.hash.toHex() + '-' + event.logIndex.toString()
```

### 3. Handle Edge Cases

```typescript
// Check for zero address
if (event.params.from.toHex() != '0x0000000000000000000000000000000000000000') {
  // Process
}

// Null checks
let user = User.load(id)
if (!user) {
  user = new User(id)
}
```

### 4. Gas Optimization

- Minimize entity saves
- Batch operations when possible
- Use BigInt arithmetic carefully

### 5. Start Block

Set appropriate start block to reduce indexing time:

```yaml
source:
  startBlock: 18000000  # Contract deployment block
```

## Deployment Options

### Subgraph Studio (Recommended)

- Decentralized network
- Higher reliability
- Pay per query (GRT tokens)
- More features

### Hosted Service (Being Deprecated)

- Free
- Centralized
- Being phased out in favor of decentralized network

### Self-Hosted Graph Node

Run your own Graph Node:

```bash
git clone https://github.com/graphprotocol/graph-node
cd graph-node/docker
docker-compose up
```

## Pricing

### Subgraph Studio
- Queries cost GRT (The Graph's token)
- ~$0.00001 - $0.0001 per query
- Pay-as-you-go

### Hosted Service
- Free while available
- Sunset planned

## Limitations

- **No Dynamic Queries**: Schema is fixed at deploy time
- **Query Complexity Limits**: Very complex queries may timeout
- **No Aggregations**: Limited built-in aggregation functions
- **Indexing Delay**: ~30 seconds to few minutes
- **No UPDATE/DELETE**: Append-only (can remove entities in mappings)

## When to Use The Graph

✅ **Perfect for:**
- Production dApp backends
- Real-time data needs
- Custom data structures
- Complex relationships between entities
- High query volumes

❌ **Not ideal for:**
- Ad-hoc analysis (use Dune)
- One-off queries
- Frequently changing schemas
- Deep historical analysis without planning

## Resources

- [The Graph Docs](https://thegraph.com/docs/)
- [Subgraph Studio](https://thegraph.com/studio/)
- [AssemblyScript Docs](https://www.assemblyscript.org/)
- [Example Subgraphs](https://github.com/graphprotocol/example-subgraphs)
- [The Graph Discord](https://discord.gg/graphprotocol)
- [Query Playground](https://thegraph.com/hosted-service/)

## Example Files

This directory contains:
- [subgraph.yaml](subgraph.yaml) - Example subgraph configuration
- [schema.graphql](schema.graphql) - Example schema definition
- [mappings/token.ts](mappings/token.ts) - Example event handlers
- [query-examples.js](query-examples.js) - Querying subgraphs with JavaScript
