require('dotenv').config()
const axios = require('axios')

/**
 * The Graph Query Examples
 *
 * Shows how to query a subgraph using GraphQL
 */

// Replace with your subgraph's query endpoint
const SUBGRAPH_URL = process.env.SUBGRAPH_URL || 'https://api.studio.thegraph.com/query/YOUR_SUBGRAPH_ID'

/**
 * Helper function to query the subgraph
 */
async function querySubgraph(query, variables = {}) {
  try {
    const response = await axios.post(SUBGRAPH_URL, {
      query,
      variables
    })

    if (response.data.errors) {
      console.error('GraphQL Errors:', response.data.errors)
      return null
    }

    return response.data.data
  } catch (error) {
    console.error('Query failed:', error.message)
    return null
  }
}

/**
 * Example 1: Basic query - Get recent transfers
 */
async function getRecentTransfers() {
  console.log('=== Recent Transfers ===\n')

  const query = `
    {
      transfers(
        first: 10
        orderBy: timestamp
        orderDirection: desc
      ) {
        id
        from {
          address
        }
        to {
          address
        }
        value
        timestamp
        transactionHash
      }
    }
  `

  const data = await querySubgraph(query)

  if (data && data.transfers) {
    console.log(`Found ${data.transfers.length} transfers:\n`)
    data.transfers.forEach((transfer, i) => {
      const date = new Date(parseInt(transfer.timestamp) * 1000)
      console.log(`Transfer ${i + 1}:`)
      console.log(`  From: ${transfer.from.address}`)
      console.log(`  To: ${transfer.to.address}`)
      console.log(`  Value: ${transfer.value}`)
      console.log(`  Time: ${date.toISOString()}`)
      console.log(`  Tx: ${transfer.transactionHash}`)
      console.log()
    })
  }
}

/**
 * Example 2: Filtered query - Get large transfers
 */
async function getLargeTransfers() {
  console.log('=== Large Transfers (>1000 tokens) ===\n')

  const query = `
    {
      transfers(
        first: 10
        where: {
          value_gt: "1000000000"
        }
        orderBy: value
        orderDirection: desc
      ) {
        from {
          address
        }
        to {
          address
        }
        value
        timestamp
      }
    }
  `

  const data = await querySubgraph(query)

  if (data && data.transfers) {
    console.log(`Found ${data.transfers.length} large transfers\n`)
    data.transfers.forEach((transfer, i) => {
      console.log(`${i + 1}. ${transfer.value} tokens`)
      console.log(`   ${transfer.from.address} → ${transfer.to.address}`)
    })
    console.log()
  }
}

/**
 * Example 3: Parameterized query - Get transfers for specific address
 */
async function getTransfersForAddress(address) {
  console.log(`=== Transfers for ${address} ===\n`)

  const query = `
    query GetUserTransfers($address: String!) {
      users(where: { address: $address }) {
        address
        balance
        totalSent
        totalReceived
        transfersSentCount
        transfersReceivedCount
        transfersSent(first: 5, orderBy: timestamp, orderDirection: desc) {
          to {
            address
          }
          value
          timestamp
        }
        transfersReceived(first: 5, orderBy: timestamp, orderDirection: desc) {
          from {
            address
          }
          value
          timestamp
        }
      }
    }
  `

  const variables = { address: address.toLowerCase() }
  const data = await querySubgraph(query, variables)

  if (data && data.users && data.users.length > 0) {
    const user = data.users[0]

    console.log('Balance:', user.balance)
    console.log('Total Sent:', user.totalSent)
    console.log('Total Received:', user.totalReceived)
    console.log('Transfers Sent:', user.transfersSentCount)
    console.log('Transfers Received:', user.transfersReceivedCount)

    console.log('\nRecent Sends:')
    user.transfersSent.forEach((t, i) => {
      console.log(`  ${i + 1}. ${t.value} to ${t.to.address}`)
    })

    console.log('\nRecent Receives:')
    user.transfersReceived.forEach((t, i) => {
      console.log(`  ${i + 1}. ${t.value} from ${t.from.address}`)
    })
  } else {
    console.log('User not found or has no activity')
  }
  console.log()
}

/**
 * Example 4: Aggregated data - Top holders
 */
async function getTopHolders() {
  console.log('=== Top 10 Token Holders ===\n')

  const query = `
    {
      users(
        first: 10
        where: {
          balance_gt: "0"
        }
        orderBy: balance
        orderDirection: desc
      ) {
        address
        balance
        transfersSentCount
        transfersReceivedCount
      }
    }
  `

  const data = await querySubgraph(query)

  if (data && data.users) {
    console.log(`Rank | Address | Balance | Transfers\n`)
    console.log('-'.repeat(80))

    data.users.forEach((user, i) => {
      const transfers = parseInt(user.transfersSentCount) + parseInt(user.transfersReceivedCount)
      console.log(
        `${(i + 1).toString().padStart(4)} | ${user.address.slice(0, 10)}... | ${user.balance.padStart(20)} | ${transfers}`
      )
    })
    console.log()
  }
}

/**
 * Example 5: Pagination - Get all transfers in chunks
 */
async function getAllTransfersPaginated() {
  console.log('=== Paginated Transfers (All) ===\n')

  const pageSize = 100
  let allTransfers = []
  let skip = 0
  let hasMore = true

  while (hasMore) {
    const query = `
      {
        transfers(
          first: ${pageSize}
          skip: ${skip}
          orderBy: timestamp
          orderDirection: asc
        ) {
          id
          value
          timestamp
        }
      }
    `

    const data = await querySubgraph(query)

    if (data && data.transfers && data.transfers.length > 0) {
      allTransfers = allTransfers.concat(data.transfers)
      skip += pageSize
      console.log(`Fetched ${allTransfers.length} transfers...`)

      if (data.transfers.length < pageSize) {
        hasMore = false
      }
    } else {
      hasMore = false
    }
  }

  console.log(`\nTotal transfers fetched: ${allTransfers.length}\n`)
  return allTransfers
}

/**
 * Example 6: Time-based query - Transfers in date range
 */
async function getTransfersInDateRange(startDate, endDate) {
  console.log(`=== Transfers from ${startDate} to ${endDate} ===\n`)

  const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000)
  const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000)

  const query = `
    query GetTransfersInRange($start: BigInt!, $end: BigInt!) {
      transfers(
        where: {
          timestamp_gte: $start
          timestamp_lte: $end
        }
        orderBy: timestamp
        orderDirection: desc
      ) {
        id
        value
        timestamp
        from {
          address
        }
        to {
          address
        }
      }
    }
  `

  const variables = {
    start: startTimestamp.toString(),
    end: endTimestamp.toString()
  }

  const data = await querySubgraph(query, variables)

  if (data && data.transfers) {
    console.log(`Found ${data.transfers.length} transfers in date range\n`)

    // Calculate total volume
    const totalVolume = data.transfers.reduce((sum, t) => sum + BigInt(t.value), BigInt(0))
    console.log(`Total volume: ${totalVolume}`)
  }
  console.log()
}

/**
 * Example 7: Historical query - Data at specific block
 */
async function getStateAtBlock(blockNumber) {
  console.log(`=== State at Block ${blockNumber} ===\n`)

  const query = `
    query GetStateAtBlock($block: Int!) {
      users(
        first: 5
        block: { number: $block }
        orderBy: balance
        orderDirection: desc
      ) {
        address
        balance
      }
      token(
        id: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
        block: { number: $block }
      ) {
        totalSupply
        transferCount
        holderCount
      }
    }
  `

  const variables = { block: blockNumber }
  const data = await querySubgraph(query, variables)

  if (data) {
    if (data.token) {
      console.log('Token Stats:')
      console.log(`  Total Supply: ${data.token.totalSupply}`)
      console.log(`  Transfer Count: ${data.token.transferCount}`)
      console.log(`  Holder Count: ${data.token.holderCount}`)
    }

    if (data.users) {
      console.log('\nTop 5 Holders:')
      data.users.forEach((user, i) => {
        console.log(`  ${i + 1}. ${user.address}: ${user.balance}`)
      })
    }
  }
  console.log()
}

/**
 * Example 8: Complex query with nested data
 */
async function getComplexData() {
  console.log('=== Complex Nested Query ===\n')

  const query = `
    {
      token(id: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48") {
        symbol
        name
        totalSupply
        transferCount
        users(
          first: 3
          orderBy: balance
          orderDirection: desc
        ) {
          address
          balance
          transfersSent(first: 2) {
            value
            to {
              address
            }
          }
        }
      }
    }
  `

  const data = await querySubgraph(query)

  if (data && data.token) {
    console.log(`Token: ${data.token.name} (${data.token.symbol})`)
    console.log(`Total Supply: ${data.token.totalSupply}`)
    console.log(`Total Transfers: ${data.token.transferCount}`)
    console.log('\nTop Holders with Recent Activity:')

    data.token.users.forEach((user, i) => {
      console.log(`\n${i + 1}. ${user.address}`)
      console.log(`   Balance: ${user.balance}`)
      console.log(`   Recent sends:`)
      user.transfersSent.forEach(t => {
        console.log(`     - ${t.value} to ${t.to.address.slice(0, 10)}...`)
      })
    })
  }
  console.log()
}

/**
 * Main function to run all examples
 */
async function main() {
  console.log('The Graph Query Examples\n')
  console.log('=' .repeat(60) + '\n')

  if (!process.env.SUBGRAPH_URL) {
    console.log('SUBGRAPH_URL not configured in .env')
    console.log('These are example queries. To run them:')
    console.log('1. Deploy a subgraph following the README')
    console.log('2. Add SUBGRAPH_URL to .env')
    console.log('3. Run this script again\n')
    return
  }

  try {
    await getRecentTransfers()
    await getLargeTransfers()
    await getTransfersForAddress('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045')
    await getTopHolders()
    await getTransfersInDateRange('2024-01-01', '2024-01-07')
    await getStateAtBlock(18000000)
    await getComplexData()

    console.log('=== All Examples Complete ===')

  } catch (error) {
    console.error('Error:', error.message)
  }
}

main()

module.exports = {
  querySubgraph,
  getRecentTransfers,
  getLargeTransfers,
  getTransfersForAddress,
  getTopHolders
}
