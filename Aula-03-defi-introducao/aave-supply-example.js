/**
 * Aave Supply Example - JavaScript/ethers.js implementation
 *
 * This script demonstrates how to supply assets to Aave Protocol v3
 * using ethers.js library
 */

const { ethers } = require('ethers');

// Aave Pool ABI (simplified - only supply function)
const AAVE_POOL_ABI = [
    "function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external"
];

// ERC20 ABI (simplified)
const ERC20_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint256)",
    "function allowance(address owner, address spender) external view returns (uint256)"
];

/**
 * Aave Pool Addresses by Network
 */
const AAVE_POOL_ADDRESSES = {
    sepolia: "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951"
};


/**
 * Supply tokens to Aave Protocol
 *
 * @param {ethers.Signer} signer - The wallet/signer with tokens to supply
 * @param {string} assetAddress - The address of the token to supply (e.g., USDC)
 * @param {string} amount - The amount to supply (in token's smallest unit)
 * @param {string} network - The network name (mainnet, polygon, etc.)
 *
 * @example
 * // Supply 100 USDC (assuming 6 decimals)
 * const provider = new ethers.JsonRpcProvider(RPC_URL);
 * const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
 * await supplyToAave(wallet, USDC_ADDRESS, "100000000", "mainnet");
 */
async function supplyToAave(signer, assetAddress, amount, network = "mainnet") {
    try {
        console.log("🚀 Starting Aave Supply Process...");

        // Get the Aave Pool address for the specified network
        const aavePoolAddress = AAVE_POOL_ADDRESSES[network];
        if (!aavePoolAddress) {
            throw new Error(`Unsupported network: ${network}`);
        }

        // Create contract instances
        const token = new ethers.Contract(assetAddress, ERC20_ABI, signer);
        const aavePool = new ethers.Contract(aavePoolAddress, AAVE_POOL_ABI, signer);

        const userAddress = await signer.getAddress();

        // Step 1: Check user balance
        console.log("📊 Checking balance...");
        const balance = await token.balanceOf(userAddress);
        console.log(`   Balance: ${ethers.formatUnits(balance, 6)} tokens`);

        if (balance < amount) {
            throw new Error("Insufficient balance");
        }

        // Step 2: Check current allowance
        console.log("🔍 Checking allowance...");
        const currentAllowance = await token.allowance(userAddress, aavePoolAddress);
        console.log(`   Current allowance: ${ethers.formatUnits(currentAllowance, 6)}`);

        // Step 3: Approve Aave Pool if necessary
        if (currentAllowance < amount) {
            console.log("✅ Approving Aave Pool to spend tokens...");
            const approveTx = await token.approve(aavePoolAddress, amount);
            console.log(`   Approval tx: ${approveTx.hash}`);
            await approveTx.wait();
            console.log("   ✓ Approval confirmed");
        } else {
            console.log("   ✓ Sufficient allowance already exists");
        }

        // Step 4: Supply to Aave
        console.log("💰 Supplying to Aave...");
        const supplyTx = await aavePool.supply(
            assetAddress,      // asset to supply
            amount,            // amount to supply
            userAddress,       // receive aTokens to this address
            0                  // referral code (0 = no referral)
        );

        console.log(`   Supply tx: ${supplyTx.hash}`);
        const receipt = await supplyTx.wait();
        console.log("   ✓ Supply confirmed");

        console.log("\n🎉 Successfully supplied to Aave!");
        console.log(`   You will now receive aTokens and earn interest`);

        return receipt;

    } catch (error) {
        console.error("❌ Error supplying to Aave:", error.message);
        throw error;
    }
}

/**
 * Example usage with ethers.js v6
 */
async function example() {
    // Configuration
    const RPC_URL = "https://eth-mainnet.g.alchemy.com/v2/YOUR-API-KEY";
    const PRIVATE_KEY = "your-private-key-here";
    const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // USDC on Ethereum

    // Setup provider and wallet
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    // Supply 100 USDC (USDC has 6 decimals)
    const amount = ethers.parseUnits("100", 6);

    await supplyToAave(wallet, USDC_ADDRESS, amount.toString(), "mainnet");
}

// Export for use in other modules
module.exports = {
    supplyToAave,
    AAVE_POOL_ADDRESSES,
    AAVE_POOL_ABI,
    ERC20_ABI
};

// Uncomment to run the example
// example().catch(console.error);
