# Dune Analytics

## Overview

Dune Analytics is a powerful blockchain analytics platform that allows you to query blockchain data using SQL. All EVM chain data is pre-indexed into a PostgreSQL-compatible database, making complex queries fast and accessible.

## Why Use Dune?

✅ **Pre-indexed Data**: All blockchain data already parsed and organized
✅ **SQL Interface**: Use familiar SQL syntax
✅ **Fast Queries**: Optimized for analytical workloads
✅ **Free Tier**: Generous free tier for learning and small projects
✅ **Community**: Access thousands of public queries and dashboards
✅ **No Infrastructure**: No need to run your own nodes or databases

## Key Concepts

### Tables

Dune organizes blockchain data into several table categories:

#### 1. Raw Tables
- `ethereum.transactions` - All transactions
- `ethereum.logs` - All event logs
- `ethereum.traces` - Internal transactions
- `ethereum.blocks` - Block data

#### 2. Decoded Tables
When contracts are decoded on Dune, you get human-readable tables:
- `uniswap_v3_ethereum.Factory_evt_PoolCreated`
- `erc20_ethereum.evt_Transfer`
- `erc721_ethereum.evt_Transfer`

#### 3. Spells (Community Tables)
Pre-built tables created by the community:
- `tokens.erc20` - All ERC20 tokens
- `dex.trades` - Aggregated DEX trades
- `nft.trades` - Aggregated NFT trades

### Blockchain-Specific Schemas

Different chains have different schemas:
- `ethereum.*`
- `polygon.*`
- `arbitrum.*`
- `optimism.*`
- `base.*`
- `bnb.*`

## Getting Started

### 1. Create a Dune Account

Sign up at [dune.com](https://dune.com)

### 2. Explore Existing Queries

Browse [Dune Discover](https://dune.com/discover) to see examples and learn from the community.

### 3. Create Your First Query

Navigate to "New Query" and start writing SQL!

## SQL Examples

See [example-queries.sql](example-queries.sql) for a comprehensive collection of example queries.

### Basic Query: Get Latest Blocks

\`\`\`sql
SELECT
    number,
    time,
    gas_used,
    gas_limit
FROM ethereum.blocks
ORDER BY number DESC
LIMIT 10
\`\`\`

### Token Transfers

\`\`\`sql
SELECT
    evt_block_time,
    evt_tx_hash,
    "from",
    "to",
    value / 1e6 as amount_usdc
FROM erc20_ethereum.evt_Transfer
WHERE contract_address = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48 -- USDC
    AND evt_block_time > NOW() - INTERVAL '7' day
ORDER BY evt_block_time DESC
LIMIT 100
\`\`\`

### Aggregated Trading Volume

\`\`\`sql
SELECT
    DATE_TRUNC('day', block_time) as day,
    COUNT(*) as num_trades,
    SUM(amount_usd) as volume_usd
FROM dex.trades
WHERE blockchain = 'ethereum'
    AND block_time > NOW() - INTERVAL '30' day
GROUP BY 1
ORDER BY 1 DESC
\`\`\`

## Using the Dune API

You can query Dune programmatically using their API.

### Setup

1. Get API key from [Dune Settings](https://dune.com/settings/api)
2. Install Dune client:

\`\`\`bash
npm install @dune-analytics/client-sdk
\`\`\`

### Basic API Usage

See [api-integration.js](api-integration.js) for complete examples.

\`\`\`javascript
const { DuneClient } = require('@dune-analytics/client-sdk')

const client = new DuneClient(process.env.DUNE_API_KEY)

// Execute an existing query
const queryId = 123456
const result = await client.execute(queryId)

console.log(result.result.rows)
\`\`\`

## Query Optimization Tips

### 1. Filter Early

\`\`\`sql
-- ❌ Bad: Filters after aggregation
SELECT * FROM (
    SELECT * FROM ethereum.transactions
) WHERE block_time > NOW() - INTERVAL '1' day

-- ✅ Good: Filter first
SELECT *
FROM ethereum.transactions
WHERE block_time > NOW() - INTERVAL '1' day
\`\`\`

### 2. Use Decoded Tables When Available

\`\`\`sql
-- ❌ Slower: Parse raw logs
SELECT * FROM ethereum.logs
WHERE topic0 = '0xddf252ad...'

-- ✅ Faster: Use decoded events
SELECT * FROM erc20_ethereum.evt_Transfer
\`\`\`

### 3. Limit Time Ranges

\`\`\`sql
-- Always include time filters
WHERE evt_block_time > NOW() - INTERVAL '30' day
\`\`\`

### 4. Use Appropriate Indexes

\`\`\`sql
-- These fields are usually indexed:
-- - block_time / evt_block_time
-- - block_number / evt_block_number
-- - contract_address
-- - tx_hash / evt_tx_hash
\`\`\`

### 5. Use CTEs for Readability

\`\`\`sql
WITH daily_transfers AS (
    SELECT
        DATE_TRUNC('day', evt_block_time) as day,
        COUNT(*) as transfer_count
    FROM erc20_ethereum.evt_Transfer
    WHERE contract_address = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
    GROUP BY 1
)
SELECT * FROM daily_transfers
ORDER BY day DESC
\`\`\`

## Parameterized Queries

Create dynamic queries with parameters:

\`\`\`sql
SELECT
    evt_block_time,
    "from",
    "to",
    value
FROM erc20_ethereum.evt_Transfer
WHERE contract_address = {{token_address}}
    AND evt_block_time > {{start_date}}
LIMIT {{limit}}
\`\`\`

## Creating Dashboards

1. Create multiple queries
2. Visualize results (charts, tables, counters)
3. Combine into a dashboard
4. Share with the community or keep private

## Common Patterns

### Token Holders Over Time

\`\`\`sql
WITH transfers AS (
    SELECT
        evt_block_time,
        "to" as address,
        value
    FROM erc20_ethereum.evt_Transfer
    WHERE contract_address = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
    UNION ALL
    SELECT
        evt_block_time,
        "from" as address,
        -value
    FROM erc20_ethereum.evt_Transfer
    WHERE contract_address = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
)
SELECT
    DATE_TRUNC('day', evt_block_time) as day,
    COUNT(DISTINCT address) as unique_holders
FROM transfers
GROUP BY 1
ORDER BY 1
\`\`\`

### Top Token Holders

\`\`\`sql
WITH balances AS (
    SELECT
        "to" as address,
        SUM(value) as balance
    FROM erc20_ethereum.evt_Transfer
    WHERE contract_address = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
    GROUP BY 1
    UNION ALL
    SELECT
        "from" as address,
        -SUM(value) as balance
    FROM erc20_ethereum.evt_Transfer
    WHERE contract_address = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
    GROUP BY 1
)
SELECT
    address,
    SUM(balance) / 1e6 as balance_usdc
FROM balances
GROUP BY 1
HAVING SUM(balance) > 0
ORDER BY 2 DESC
LIMIT 100
\`\`\`

## Pricing

- **Free**: 25 query credits/day
- **Plus** ($39/mo): More credits, faster execution
- **Premium** ($399/mo): Highest limits, priority support
- **Enterprise**: Custom pricing

API access requires at least Plus tier.

## Best Practices

1. **Start Simple**: Test queries on small date ranges first
2. **Use Materialized Views**: Save common queries as views
3. **Cache Results**: Use Dune's result caching
4. **Join the Community**: Learn from other analysts
5. **Document Queries**: Add comments explaining logic
6. **Version Control**: Keep query backups

## Limitations

- **No Real-time**: ~5-15 minute delay for new blocks
- **No Custom Indexing**: Can't add custom computed fields
- **SQL Only**: No support for other languages
- **Credit Limits**: Free tier has daily limits
- **No Write Access**: Read-only queries

## When to Use Dune

✅ **Perfect for:**
- Historical analytics and reports
- Token analysis
- Protocol metrics
- Market research
- Dashboard creation
- One-off queries

❌ **Not ideal for:**
- Real-time data (<5 min latency)
- Custom business logic
- Application backends
- High-frequency updates
- Sub-second query times

## Resources

- [Dune Documentation](https://docs.dune.com/)
- [Dune Discord](https://discord.gg/dunecom)
- [SQL Style Guide](https://docs.dune.com/query-engine/dune-sql-reference)
- [Example Dashboards](https://dune.com/browse/dashboards)
