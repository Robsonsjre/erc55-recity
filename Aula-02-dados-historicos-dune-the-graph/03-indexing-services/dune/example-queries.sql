-- ═══════════════════════════════════════════════════════════════
-- Dune Analytics - Example SQL Queries
-- ═══════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────
-- 1. Basic Queries - Getting Started
-- ───────────────────────────────────────────────────────────────

-- Get latest blocks
SELECT
    number as block_number,
    time as block_time,
    miner,
    gas_used,
    gas_limit,
    base_fee_per_gas / 1e9 as base_fee_gwei
FROM ethereum.blocks
ORDER BY number DESC
LIMIT 10;


-- Get recent transactions
SELECT
    block_time,
    block_number,
    hash as tx_hash,
    "from" as sender,
    "to" as recipient,
    value / 1e18 as eth_value,
    gas_price / 1e9 as gas_price_gwei
FROM ethereum.transactions
WHERE block_time > NOW() - INTERVAL '1' hour
ORDER BY block_time DESC
LIMIT 100;


-- ───────────────────────────────────────────────────────────────
-- 2. ERC20 Token Queries
-- ───────────────────────────────────────────────────────────────

-- USDC transfers in last 24 hours
SELECT
    evt_block_time,
    evt_tx_hash,
    "from",
    "to",
    value / 1e6 as amount_usdc
FROM erc20_ethereum.evt_Transfer
WHERE contract_address = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48 -- USDC
    AND evt_block_time > NOW() - INTERVAL '1' day
ORDER BY evt_block_time DESC
LIMIT 1000;


-- Top 10 USDC recipients today
SELECT
    "to" as recipient,
    COUNT(*) as transfer_count,
    SUM(value) / 1e6 as total_usdc_received
FROM erc20_ethereum.evt_Transfer
WHERE contract_address = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
    AND evt_block_time > CURRENT_DATE
GROUP BY "to"
ORDER BY total_usdc_received DESC
LIMIT 10;


-- Token holders over time (USDC)
WITH transfers_in AS (
    SELECT
        DATE_TRUNC('day', evt_block_time) as day,
        "to" as holder
    FROM erc20_ethereum.evt_Transfer
    WHERE contract_address = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
),
transfers_out AS (
    SELECT
        DATE_TRUNC('day', evt_block_time) as day,
        "from" as holder
    FROM erc20_ethereum.evt_Transfer
    WHERE contract_address = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
),
all_holders AS (
    SELECT day, holder FROM transfers_in
    UNION
    SELECT day, holder FROM transfers_out
)
SELECT
    day,
    COUNT(DISTINCT holder) as unique_holders
FROM all_holders
WHERE day > NOW() - INTERVAL '30' day
GROUP BY day
ORDER BY day;


-- ───────────────────────────────────────────────────────────────
-- 3. DEX Trading Analysis
-- ───────────────────────────────────────────────────────────────

-- Daily DEX volume on Ethereum (using Spells)
SELECT
    DATE_TRUNC('day', block_time) as day,
    project as dex_name,
    COUNT(*) as num_trades,
    SUM(amount_usd) as volume_usd
FROM dex.trades
WHERE blockchain = 'ethereum'
    AND block_time > NOW() - INTERVAL '30' day
GROUP BY 1, 2
ORDER BY 1 DESC, 4 DESC;


-- Uniswap V3 swaps for specific pool
SELECT
    evt_block_time,
    evt_tx_hash,
    sender,
    recipient,
    amount0 / 1e18 as eth_amount,
    amount1 / 1e6 as usdc_amount,
    sqrtPriceX96
FROM uniswap_v3_ethereum.Pair_evt_Swap
WHERE contract_address = 0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640 -- USDC/ETH 0.05%
    AND evt_block_time > NOW() - INTERVAL '7' day
ORDER BY evt_block_time DESC
LIMIT 500;


-- Top traded tokens by volume
SELECT
    token_bought_address,
    t.symbol as token_symbol,
    COUNT(*) as num_trades,
    SUM(amount_usd) as total_volume_usd
FROM dex.trades dt
LEFT JOIN tokens.erc20 t
    ON dt.token_bought_address = t.contract_address
    AND dt.blockchain = t.blockchain
WHERE dt.blockchain = 'ethereum'
    AND dt.block_time > NOW() - INTERVAL '7' day
GROUP BY 1, 2
ORDER BY 4 DESC
LIMIT 20;


-- ───────────────────────────────────────────────────────────────
-- 4. NFT Analysis
-- ───────────────────────────────────────────────────────────────

-- Recent NFT sales
SELECT
    block_time,
    project,
    nft_contract_address,
    token_id,
    buyer,
    seller,
    amount_usd,
    platform
FROM nft.trades
WHERE blockchain = 'ethereum'
    AND block_time > NOW() - INTERVAL '1' day
ORDER BY amount_usd DESC
LIMIT 50;


-- Daily NFT marketplace volume
SELECT
    DATE_TRUNC('day', block_time) as day,
    platform,
    COUNT(*) as num_sales,
    SUM(amount_usd) as volume_usd
FROM nft.trades
WHERE blockchain = 'ethereum'
    AND block_time > NOW() - INTERVAL '30' day
GROUP BY 1, 2
ORDER BY 1 DESC, 4 DESC;


-- ───────────────────────────────────────────────────────────────
-- 5. Gas Analysis
-- ───────────────────────────────────────────────────────────────

-- Average gas price by hour
SELECT
    DATE_TRUNC('hour', block_time) as hour,
    AVG(gas_price / 1e9) as avg_gas_price_gwei,
    MIN(gas_price / 1e9) as min_gas_price_gwei,
    MAX(gas_price / 1e9) as max_gas_price_gwei
FROM ethereum.transactions
WHERE block_time > NOW() - INTERVAL '7' day
GROUP BY 1
ORDER BY 1 DESC;


-- Top gas spenders
SELECT
    "from" as address,
    COUNT(*) as tx_count,
    SUM(gas_price * gas_used) / 1e18 as total_eth_spent_on_gas
FROM ethereum.transactions
WHERE block_time > NOW() - INTERVAL '30' day
GROUP BY 1
ORDER BY 3 DESC
LIMIT 20;


-- Gas used by contract
SELECT
    "to" as contract_address,
    COUNT(*) as call_count,
    AVG(gas_used) as avg_gas_used,
    SUM(gas_used) as total_gas_used
FROM ethereum.transactions
WHERE block_time > NOW() - INTERVAL '7' day
    AND "to" IS NOT NULL
GROUP BY 1
ORDER BY 4 DESC
LIMIT 20;


-- ───────────────────────────────────────────────────────────────
-- 6. Lending Protocol Analysis (Aave Example)
-- ───────────────────────────────────────────────────────────────

-- Aave deposits
SELECT
    evt_block_time,
    reserve as token_address,
    "user",
    amount / POWER(10, 18) as amount,
    evt_tx_hash
FROM aave_v3_ethereum.Pool_evt_Supply
WHERE evt_block_time > NOW() - INTERVAL '7' day
ORDER BY evt_block_time DESC
LIMIT 100;


-- Aave borrows by token
SELECT
    DATE_TRUNC('day', evt_block_time) as day,
    reserve as token_address,
    COUNT(*) as borrow_count,
    SUM(amount) / POWER(10, 18) as total_borrowed
FROM aave_v3_ethereum.Pool_evt_Borrow
WHERE evt_block_time > NOW() - INTERVAL '30' day
GROUP BY 1, 2
ORDER BY 1 DESC, 4 DESC;


-- ───────────────────────────────────────────────────────────────
-- 7. Smart Contract Events (Raw Logs)
-- ───────────────────────────────────────────────────────────────

-- Query raw Transfer events (when decoded table not available)
SELECT
    block_time,
    tx_hash,
    contract_address,
    topic1 as from_address,
    topic2 as to_address,
    data as value_hex
FROM ethereum.logs
WHERE topic0 = 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef -- Transfer event
    AND contract_address = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48 -- USDC
    AND block_time > NOW() - INTERVAL '1' hour
LIMIT 100;


-- ───────────────────────────────────────────────────────────────
-- 8. Cross-Chain Analysis
-- ───────────────────────────────────────────────────────────────

-- Compare DEX volume across chains
SELECT
    blockchain,
    DATE_TRUNC('day', block_time) as day,
    SUM(amount_usd) as volume_usd
FROM dex.trades
WHERE blockchain IN ('ethereum', 'polygon', 'arbitrum', 'optimism')
    AND block_time > NOW() - INTERVAL '30' day
GROUP BY 1, 2
ORDER BY 2 DESC, 3 DESC;


-- ───────────────────────────────────────────────────────────────
-- 9. Wallet Analysis
-- ───────────────────────────────────────────────────────────────

-- Wallet activity summary
WITH wallet_txs AS (
    SELECT
        "from" as wallet,
        block_time,
        value / 1e18 as eth_value,
        gas_price * gas_used / 1e18 as gas_cost
    FROM ethereum.transactions
    WHERE "from" = 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 -- Vitalik
        AND block_time > NOW() - INTERVAL '30' day
)
SELECT
    COUNT(*) as tx_count,
    SUM(eth_value) as total_eth_sent,
    SUM(gas_cost) as total_gas_spent,
    MIN(block_time) as first_tx,
    MAX(block_time) as last_tx
FROM wallet_txs;


-- ───────────────────────────────────────────────────────────────
-- 10. Advanced: Token Balance Reconstruction
-- ───────────────────────────────────────────────────────────────

-- Calculate current USDC balance for an address
WITH inflows AS (
    SELECT
        "to" as address,
        SUM(value) as total_in
    FROM erc20_ethereum.evt_Transfer
    WHERE contract_address = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
        AND "to" = 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
    GROUP BY 1
),
outflows AS (
    SELECT
        "from" as address,
        SUM(value) as total_out
    FROM erc20_ethereum.evt_Transfer
    WHERE contract_address = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
        AND "from" = 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
    GROUP BY 1
)
SELECT
    COALESCE(i.address, o.address) as wallet,
    (COALESCE(i.total_in, 0) - COALESCE(o.total_out, 0)) / 1e6 as balance_usdc
FROM inflows i
FULL OUTER JOIN outflows o ON i.address = o.address;


-- ───────────────────────────────────────────────────────────────
-- Tips for Query Optimization
-- ───────────────────────────────────────────────────────────────

-- 1. Always filter by time to reduce scan size
-- 2. Use decoded tables when available (faster than parsing logs)
-- 3. Use CTEs for complex queries (more readable)
-- 4. Leverage indexed columns: block_time, contract_address, tx_hash
-- 5. Test on small date ranges first
-- 6. Use LIMIT during development
-- 7. Consider using spells (pre-computed tables) for common queries
