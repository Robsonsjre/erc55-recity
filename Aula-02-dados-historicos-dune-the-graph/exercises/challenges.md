# Workshop Exercises & Challenges

These hands-on exercises will help you practice querying historical blockchain data using different methods.

## Setup

Before starting, ensure you have:
- [ ] Configured `.env` file with RPC URLs
- [ ] Installed dependencies (`npm install`)
- [ ] (Optional) Archive RPC access for Module 2 exercises
- [ ] (Optional) Dune account for Module 3 exercises

---

## Module 1: Event Filters

### Exercise 1.1: Basic Transfer Query (Easy)

**Objective**: Query the last 100 USDT Transfer events

**Tasks**:
1. Find the USDT contract address
2. Create a filter for Transfer events
3. Query the last 100 blocks
4. Parse and display the results

**Expected Output**: List of 100 transfers with from, to, and amount

<details>
<summary>Hint</summary>

```javascript
const USDT_ADDRESS = '0xdAC17F958D2ee523a2206206994597C13D831ec7'
const transferSig = ethers.utils.id('Transfer(address,address,uint256)')
```
</details>

---

### Exercise 1.2: Filter by Address (Medium)

**Objective**: Find all USDC transfers TO a specific address in the last 5000 blocks

**Tasks**:
1. Choose a well-known address (e.g., Binance hot wallet)
2. Create a filter with the address in topic2 position
3. Calculate the total USDC received

**Expected Output**: Number of transfers and total amount received

<details>
<summary>Hint</summary>

Topic positions for Transfer(address indexed from, address indexed to, uint256 value):
- Topic 0: Event signature
- Topic 1: from address
- Topic 2: to address
</details>

---

### Exercise 1.3: Pagination Challenge (Hard)

**Objective**: Query all Transfer events for a token over the last 20,000 blocks

**Tasks**:
1. Implement pagination to handle RPC limits
2. Query in chunks of 2000 blocks
3. Aggregate results
4. Calculate statistics: total transfers, unique senders, unique receivers

**Expected Output**: Aggregated statistics across all chunks

---

## Module 2: Transaction Simulation

### Exercise 2.1: Historical Balance (Easy)

**Objective**: Find Vitalik's USDC balance 10,000 blocks ago

**Tasks**:
1. Get current block number
2. Calculate historical block number
3. Query balance at that block
4. Compare with current balance

**Expected Output**: Historical and current balance comparison

**Note**: Requires archive node access

<details>
<summary>Hint</summary>

```javascript
const balance = await contract.balanceOf(address, { blockTag: blockNumber })
```
</details>

---

### Exercise 2.2: Price History (Medium)

**Objective**: Query ETH/USDC price from Uniswap V3 pool at 5 different historical blocks

**Tasks**:
1. Find the Uniswap V3 ETH/USDC pool address
2. Query `slot0()` at 5 blocks (current, -1000, -5000, -10000, -50000)
3. Calculate price from `sqrtPriceX96`
4. Display price chart

**Expected Output**: Price at 5 different times

<details>
<summary>Formula</summary>

```javascript
const price = (sqrtPriceX96 / (2 ** 96)) ** 2
```
</details>

---

### Exercise 2.3: Balance Reconstruction (Hard)

**Objective**: Reconstruct the balance history of an address over the last 30 days

**Tasks**:
1. Choose a frequently used address
2. Query balance at daily intervals (30 data points)
3. Create a time series of balances
4. Identify the largest single-day change

**Expected Output**: Daily balance array and largest change date

---

## Module 3: Indexing Services

### Exercise 3.1: Dune - Token Analytics (Easy)

**Objective**: Write a Dune query to find the top 10 most transferred ERC20 tokens today

**Tasks**:
1. Create a new query on Dune
2. Use the `erc20_ethereum.evt_Transfer` table
3. Filter for today's transfers
4. Group by token and count
5. Order by count descending

**Expected Output**: Table with token address and transfer count

<details>
<summary>SQL Starter</summary>

```sql
SELECT
    contract_address,
    COUNT(*) as transfer_count
FROM erc20_ethereum.evt_Transfer
WHERE evt_block_time > CURRENT_DATE
GROUP BY contract_address
ORDER BY transfer_count DESC
LIMIT 10
```
</details>

---

### Exercise 3.2: Dune - DEX Volume (Medium)

**Objective**: Compare Uniswap vs Sushiswap daily volume for the last 30 days

**Tasks**:
1. Use the `dex.trades` table
2. Filter for Uniswap and Sushiswap
3. Group by day and project
4. Calculate daily volume in USD
5. Create a visualization

**Expected Output**: Line chart showing volume comparison

---

### Exercise 3.3: The Graph - Simple Subgraph (Hard)

**Objective**: Create a subgraph to index a specific NFT collection

**Tasks**:
1. Choose an NFT collection (e.g., BAYC, Azuki)
2. Define schema with entities: Collection, NFT, Transfer, Owner
3. Write mapping handlers for Transfer events
4. Deploy to Subgraph Studio
5. Query to find: top owners, most transferred NFTs

**Expected Output**: Deployed subgraph with working queries

**Resources**:
- ERC721 events: Transfer(address indexed from, address indexed to, uint256 indexed tokenId)
- Follow examples in `03-indexing-services/thegraph/`

---

## Comparison Challenges

### Challenge 1: Speed Test (Medium)

**Objective**: Compare query speed across all three methods

**Tasks**:
1. Query the same data using:
   - Event filters (getLogs)
   - Dune SQL
   - The Graph (if you have a subgraph)
2. Measure execution time
3. Query: Get all transfers for USDC in a specific block range

**Expected Output**: Performance comparison table

---

### Challenge 2: Cost Analysis (Medium)

**Objective**: Calculate the cost of different approaches

**Tasks**:
1. Research pricing for:
   - RPC providers (per request)
   - Dune API (per query)
   - The Graph (per query)
2. Estimate monthly cost for:
   - 1M queries
   - 10M queries
   - 100M queries

**Expected Output**: Cost comparison matrix

---

### Challenge 3: Real-time Dashboard (Hard)

**Objective**: Build a simple dashboard showing real-time token metrics

**Tasks**:
1. Choose a method (Event filters recommended for real-time)
2. Create a script that:
   - Monitors new Transfer events
   - Calculates: transfer rate, unique users, total volume
   - Updates every block
3. Display in terminal or simple web UI

**Expected Output**: Live updating dashboard

**Bonus**: Add price data from a DEX

---

## Advanced Challenges

### Challenge 4: Multi-method Pipeline (Expert)

**Objective**: Build a data pipeline using all three methods

**Scenario**: Track whale activity (transfers >$1M)

**Tasks**:
1. Use **Event Filters** to monitor real-time transfers
2. Use **Dune** to analyze historical patterns
3. Use **The Graph** to maintain a database of known whales
4. Combine data to identify: new whales, whale clusters, patterns

**Expected Output**: Comprehensive whale tracking system

---

### Challenge 5: Custom Analytics Tool (Expert)

**Objective**: Build a complete analytics tool

**Requirements**:
- Real-time monitoring (Event Filters or WebSocket)
- Historical analysis (Dune or The Graph)
- Data export (CSV, JSON)
- Alerting system
- Web UI (optional)

**Example Use Cases**:
- Token holder analytics
- DEX trading patterns
- NFT collection statistics
- Protocol TVL tracking

**Expected Output**: Production-ready analytics tool

---

## Bonus: Debug Challenges

### Debug 1: Fix the Bug (Easy)

This code has a bug. Find and fix it:

```javascript
const transfers = await provider.getLogs({
  address: tokenAddress,
  topics: [
    ethers.utils.id('Transfer(address,address,uint256)'),
    senderAddress  // BUG: Missing padding
  ],
  fromBlock: currentBlock,
  toBlock: currentBlock - 1000  // BUG: Wrong order
})
```

---

### Debug 2: Optimize the Query (Medium)

This Dune query is slow. Optimize it:

```sql
SELECT *
FROM ethereum.transactions
WHERE value > 1000000000000000000
  AND "to" IN (
    SELECT contract_address FROM tokens.erc20
  )
```

**Hint**: Missing time filter, SELECT *, inefficient subquery

---

## Solutions

Solutions are available in the `exercises/solutions/` directory, but try to solve them yourself first!

## Evaluation Criteria

When completing exercises, check that you:
- [ ] Code runs without errors
- [ ] Results are accurate
- [ ] Code is well-commented
- [ ] Handles edge cases (null values, zero addresses, etc.)
- [ ] Performance is reasonable
- [ ] Uses appropriate method for the use case

## Need Help?

- Review the module READMEs
- Check the example code in each module
- Search documentation for the relevant tool
- Ask in community Discord servers
- Remember: struggling is part of learning!

## Submission (Optional)

If this is part of a class, submit:
1. Your code for each exercise
2. Screenshots of outputs
3. A brief write-up comparing the methods
4. (Optional) Any additional challenges you created

Good luck! 🚀
