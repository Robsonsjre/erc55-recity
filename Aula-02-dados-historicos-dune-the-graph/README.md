# Historic Data on EVM Blockchains - Educational Workshop

A comprehensive 1-hour class teaching different approaches to query historical blockchain data on EVM-compatible chains.

## 🎯 Learning Objectives

By the end of this workshop, you will understand:
- How to query blockchain events using filters
- How to simulate transactions at historical states
- How to leverage indexing services (Dune Analytics & The Graph)
- Trade-offs between different approaches

## 📋 Prerequisites

- Basic understanding of Ethereum/EVM blockchains
- Familiarity with JavaScript/Node.js
- Understanding of smart contracts and events
- Node.js v16+ installed

## 🚀 Setup

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Add your RPC URL and API keys
# Edit .env with your credentials
```

## 📚 Workshop Modules

### [Module 1: Event Filters](01-event-filters/)
Learn how to query historical events directly from blockchain nodes using `getLogs`.

**Topics:**
- Understanding event logs and topics
- Filtering by address, topics, and block ranges
- Working with indexed parameters
- Performance considerations and limits

**Use cases:** Recent events, specific contract monitoring, real-time tracking

---

### [Module 2: Transaction Simulation](02-transaction-simulation/)
Discover how to query historical state by simulating read-only calls at past blocks.

**Topics:**
- Using `eth_call` with historical block numbers
- Querying past balances and contract states
- Forking networks for testing
- Using services like Tenderly

**Use cases:** Historical balances, state reconstruction, what-if analysis

---

### [Module 3: Indexing Services](03-indexing-services/)

#### [Dune Analytics](03-indexing-services/dune/)
Query blockchain data using SQL on a pre-indexed database.

**Topics:**
- Writing SQL queries for blockchain data
- Using Dune's API
- Creating dashboards
- Performance at scale

#### [The Graph](03-indexing-services/thegraph/)
Build custom subgraphs to index exactly what you need.

**Topics:**
- Defining schemas and entities
- Writing event handlers (mappings)
- Deploying subgraphs
- Querying with GraphQL

**Use cases:** Complex analytics, multi-contract tracking, production dApps

---

## 🎓 Exercises

See [exercises/challenges.md](exercises/challenges.md) for hands-on practice problems.

## 🔍 Comparison Matrix

| Method | Speed | Cost | Complexity | Historical Depth | Best For |
|--------|-------|------|------------|-----------------|----------|
| Event Filters | Fast | Low (RPC) | Low | Limited by node | Recent events |
| Simulation | Medium | Low (RPC) | Medium | Archive node required | State queries |
| Dune | Very Fast | Free/Paid | Low | Complete | Analytics, SQL users |
| The Graph | Very Fast | Moderate | High | Complete | Production dApps |

## 📖 Resources

- [Ethereum JSON-RPC Specification](https://ethereum.github.io/execution-apis/api-documentation/)
- [Dune Analytics Documentation](https://docs.dune.com/)
- [The Graph Documentation](https://thegraph.com/docs/)
- [ethers.js Documentation](https://docs.ethers.org/)

## 🤝 Contributing

Suggestions and improvements are welcome! Please open an issue or pull request.

## 📝 License

MIT
