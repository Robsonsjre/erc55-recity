require('dotenv').config()
const { DuneClient, QueryParameter } = require('@dune-analytics/client-sdk')

/**
 * Dune API Integration Examples
 *
 * Requires: npm install @dune-analytics/client-sdk
 * API Key: Get from https://dune.com/settings/api
 */

const client = new DuneClient(process.env.DUNE_API_KEY)

/**
 * Example 1: Execute an existing query
 */
async function executeQuery() {
  console.log('=== Execute Existing Query ===\n')

  if (!process.env.DUNE_API_KEY) {
    console.log('DUNE_API_KEY not configured. Skipping.')
    console.log('Get your API key from: https://dune.com/settings/api\n')
    return
  }

  // Replace with an actual query ID from your Dune account
  const queryId = 1234567 // Example: your saved query ID

  console.log(`Executing query ${queryId}...\n`)

  try {
    // Execute the query
    const execution = await client.execute(queryId)

    console.log(`Execution ID: ${execution.execution_id}`)
    console.log(`State: ${execution.state}`)

    // Wait for completion
    const result = await client.getExecutionResults(execution.execution_id)

    console.log('\nQuery Results:')
    console.log(`Rows returned: ${result.result.rows.length}`)
    console.log('\nFirst 5 rows:')
    console.log(result.result.rows.slice(0, 5))

  } catch (error) {
    console.error('Error executing query:', error.message)
    console.log('\nNote: Replace queryId with an actual query from your Dune account')
  }
}

/**
 * Example 2: Execute query with parameters
 */
async function executeParameterizedQuery() {
  console.log('\n=== Execute Query with Parameters ===\n')

  if (!process.env.DUNE_API_KEY) {
    console.log('Skipping - DUNE_API_KEY not configured.\n')
    return
  }

  const queryId = 1234567 // Your parameterized query

  // Query parameters (must match parameter names in your Dune query)
  const parameters = [
    QueryParameter.text('token_address', '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'),
    QueryParameter.number('limit', 100),
    QueryParameter.date('start_date', '2024-01-01')
  ]

  console.log('Executing query with parameters:')
  console.log(parameters)

  try {
    const result = await client.execute(queryId, parameters)

    console.log('\nExecution successful!')
    console.log(`Rows: ${result.result?.rows?.length || 0}`)

  } catch (error) {
    console.error('Error:', error.message)
  }
}

/**
 * Example 3: Get query results by execution ID
 */
async function getResults() {
  console.log('\n=== Get Results by Execution ID ===\n')

  if (!process.env.DUNE_API_KEY) {
    console.log('Skipping - DUNE_API_KEY not configured.\n')
    return
  }

  const executionId = 'your-execution-id-here'

  try {
    const result = await client.getExecutionResults(executionId)

    console.log(`State: ${result.state}`)
    console.log(`Rows: ${result.result.rows.length}`)
    console.log(`Metadata:`, result.result.metadata)

  } catch (error) {
    console.error('Error:', error.message)
  }
}

/**
 * Example 4: Execute and process results
 */
async function processResults() {
  console.log('\n=== Execute and Process Results ===\n')

  if (!process.env.DUNE_API_KEY) {
    console.log('Skipping - DUNE_API_KEY not configured.\n')
    return
  }

  const queryId = 1234567

  try {
    const execution = await client.execute(queryId)
    const result = await client.getExecutionResults(execution.execution_id)

    // Process the data
    const rows = result.result.rows

    // Example: Calculate totals
    if (rows.length > 0) {
      console.log('Processing results...\n')

      // Assuming query returns columns: day, volume_usd
      const totalVolume = rows.reduce((sum, row) => sum + (row.volume_usd || 0), 0)
      const avgVolume = totalVolume / rows.length

      console.log(`Total records: ${rows.length}`)
      console.log(`Total volume: $${totalVolume.toLocaleString()}`)
      console.log(`Average volume: $${avgVolume.toLocaleString()}`)

      // Export to JSON
      const fs = require('fs')
      fs.writeFileSync('dune-results.json', JSON.stringify(rows, null, 2))
      console.log('\nResults saved to dune-results.json')
    }

  } catch (error) {
    console.error('Error:', error.message)
  }
}

/**
 * Example 5: Refresh existing results
 */
async function refreshQuery() {
  console.log('\n=== Refresh Query Results ===\n')

  if (!process.env.DUNE_API_KEY) {
    console.log('Skipping - DUNE_API_KEY not configured.\n')
    return
  }

  const queryId = 1234567

  try {
    // Refresh (re-execute) the query
    console.log('Refreshing query...')

    const execution = await client.execute(queryId)

    console.log(`Execution started: ${execution.execution_id}`)
    console.log('Waiting for results...')

    // Poll for results
    let result = await client.getExecutionResults(execution.execution_id)

    while (result.state === 'QUERY_STATE_EXECUTING') {
      console.log('Still executing...')
      await new Promise(resolve => setTimeout(resolve, 2000))
      result = await client.getExecutionResults(execution.execution_id)
    }

    console.log(`\nComplete! State: ${result.state}`)
    console.log(`Rows: ${result.result.rows.length}`)

  } catch (error) {
    console.error('Error:', error.message)
  }
}

/**
 * Example 6: Get latest results (cached)
 */
async function getLatestResults() {
  console.log('\n=== Get Latest (Cached) Results ===\n')

  if (!process.env.DUNE_API_KEY) {
    console.log('Skipping - DUNE_API_KEY not configured.\n')
    return
  }

  const queryId = 1234567

  try {
    // Get latest results without re-executing
    // This uses cached results if available
    const result = await client.getLatestResult(queryId)

    console.log(`State: ${result.state}`)
    console.log(`Rows: ${result.result.rows.length}`)
    console.log(`Execution ID: ${result.execution_id}`)
    console.log(`Submitted at: ${result.submitted_at}`)

  } catch (error) {
    console.error('Error:', error.message)
  }
}

/**
 * Example 7: Building a data pipeline
 */
async function buildPipeline() {
  console.log('\n=== Building Data Pipeline ===\n')

  if (!process.env.DUNE_API_KEY) {
    console.log('Skipping - DUNE_API_KEY not configured.\n')
    return
  }

  // Example: Fetch data from multiple queries and combine
  const queries = [
    { id: 1234567, name: 'DEX Volume' },
    { id: 1234568, name: 'Token Transfers' },
    { id: 1234569, name: 'Gas Metrics' }
  ]

  try {
    console.log('Fetching data from multiple queries...\n')

    const results = await Promise.all(
      queries.map(async (query) => {
        console.log(`Fetching ${query.name}...`)
        const result = await client.getLatestResult(query.id)
        return {
          name: query.name,
          data: result.result.rows
        }
      })
    )

    console.log('\nResults:')
    results.forEach(result => {
      console.log(`${result.name}: ${result.data.length} rows`)
    })

    // Combine and process as needed
    // ...

  } catch (error) {
    console.error('Error:', error.message)
  }
}

/**
 * Example 8: Error handling and retries
 */
async function executeWithRetry(queryId, maxRetries = 3) {
  console.log('\n=== Execute with Retry Logic ===\n')

  if (!process.env.DUNE_API_KEY) {
    console.log('Skipping - DUNE_API_KEY not configured.\n')
    return
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxRetries}`)

      const execution = await client.execute(queryId)
      const result = await client.getExecutionResults(execution.execution_id)

      console.log('Success!')
      return result

    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error.message)

      if (attempt === maxRetries) {
        throw new Error(`Failed after ${maxRetries} attempts`)
      }

      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000
      console.log(`Waiting ${delay}ms before retry...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}

async function main() {
  try {
    console.log('Dune API Integration Examples\n')
    console.log('=' .repeat(60) + '\n')

    await executeQuery()
    await executeParameterizedQuery()
    await getResults()
    await processResults()
    await refreshQuery()
    await getLatestResults()
    await buildPipeline()

    console.log('\n=== Examples Complete ===')
    console.log('\nTo use these examples:')
    console.log('1. Create queries on dune.com')
    console.log('2. Get query IDs from the URL')
    console.log('3. Replace example query IDs in this file')
    console.log('4. Add DUNE_API_KEY to your .env file')

  } catch (error) {
    console.error('Error:', error.message)
  }
}

// Only run if called directly
if (require.main === module) {
  main()
}

module.exports = {
  executeQuery,
  executeParameterizedQuery,
  processResults,
  executeWithRetry
}
