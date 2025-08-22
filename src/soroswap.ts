
import { config } from './config.js';
import { powerLawInterpolate, interpolateMultiple } from './interpolation.js';
import type { QuoteDataPoint } from './types.js';
import { delay, generatePointsForAnalysis } from './utils.js';

interface QuoteRequest {
    assetIn: string;
    assetOut: string;
    amount: string;
    tradeType: "EXACT_IN" | "EXACT_OUT";
    protocols: string[];
    slippageBps: string;
    parts: number;
    maxHops: number;
    assetList: string[];
    feeBps: number;
}

interface SwapInfo {
    protocol: string;
    path: string[];
}

interface RoutePlan {
    swapInfo: SwapInfo;
    percent: string;
}

interface Distribution {
    protocol_id: string;
    path: string[];
    parts: number;
    is_exact_in: boolean;
}

interface RawTrade {
    amountIn: string;
    amountOutMin: string;
    distribution: Distribution[];
}

interface PlatformFee {
    feeBps: number;
    feeAmount: string;
}

interface QuoteResponse {
    assetIn: string;
    assetOut: string;
    amountIn: string;
    amountOut: number;
    otherAmountThreshold: number;
    priceImpactPct: string;
    tradeType: "EXACT_IN" | "EXACT_OUT";
    platform: string;
    rawTrade: RawTrade;
    routePlan: RoutePlan[];
    platformFee: PlatformFee;
}

interface TokenPair {
    tokenA: string;
    tokenB: string;
}

async function getTokenPairsFromPool(): Promise<TokenPair[]> {
    const fs = await import('fs/promises');
    const pools = JSON.parse(await fs.readFile('./src/pools.json', 'utf-8'));
    const usdcPairedTokens = [];
    for (const pool of pools) {
        if (pool.tokenA === config.SOROSWAP_USDC_TOKEN || pool.tokenB === config.SOROSWAP_USDC_TOKEN) {
            usdcPairedTokens.push(pool.tokenA === config.SOROSWAP_USDC_TOKEN ? pool.tokenB : pool.tokenA);
        }
    }

    const tokenPairs: TokenPair[] = [];
    const seenPairs = new Set<string>();
    for (const pool of pools) {
        if (usdcPairedTokens.includes(pool.tokenA) && usdcPairedTokens.includes(pool.tokenB)) {
            const pair = [pool.tokenA, pool.tokenB].sort().join('-');
            if (!seenPairs.has(pair)) {
                tokenPairs.push({
                    tokenA: pool.tokenA,
                    tokenB: pool.tokenB
                });
                seenPairs.add(pair);
            }
        }
    }
    return tokenPairs;
}

export async function getSoroswapTokenPairs(protocol: string): Promise<TokenPair[]> {
    // const fs = await import('fs/promises');
    // const pools = JSON.parse(await fs.readFile('./src/pools.json', 'utf-8'));
    // const filteredPools = pools.filter((pool: any) => pool.protocol === protocol);
    // const tokenPairs: TokenPair[] = [];
    // const seenPairs = new Set<string>();
    // for (const pool of filteredPools) {
    //     const pair = [pool.tokenA, pool.tokenB].sort().join('-');
    //     if (!seenPairs.has(pair)) {
    //         tokenPairs.push({
    //             tokenA: pool.tokenA,
    //             tokenB: pool.tokenB
    //         });
    //         seenPairs.add(pair);
    //     }
    // }
    // return tokenPairs;
    return [{
        tokenA: "CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA", //  XLM
        tokenB: "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75" //   USDC
    }];
}

async function getQuote(request: QuoteRequest): Promise<QuoteResponse> {
    const response = await fetch('https://api.soroswap.finance/quote', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.SOROSWAP_API_KEY}`
        },
        body: JSON.stringify(request)
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const json = await response.json();

    const quoteRes: QuoteResponse = {
        assetIn: json.assetIn,
        assetOut: json.assetOut,
        amountIn: json.amountIn,
        amountOut: Number(json.amountOut),
        otherAmountThreshold: Number(json.otherAmountThreshold),
        priceImpactPct: json.priceImpactPct,
        tradeType: json.tradeType, 
        platform: json.platform,
        rawTrade: json.rawTrade,
        routePlan: json.routePlan,
        platformFee: json.platformFee
    }
    return quoteRes;
}

/**
 * Gets quotes for all points simultaneously and returns both QuoteDataPoints and QuoteResponses
 * 
 * @param tokenPair - The token pair to get quotes for
 * @param allPoints - Array of amounts to get quotes for
 * @returns Promise<{quoteDataPoints: QuoteDataPoint[], quoteResponses: QuoteResponse[]}> - Both data points and full responses
 */
export async function getSoroswapQuotesForAllPoints(
    tokenPair: TokenPair, 
    allPoints: number[]
): Promise<QuoteDataPoint[]> {
    console.log(`Getting quotes for ${allPoints.length} points simultaneously...`);
    
    // Create all quote requests
    const quoteRequests = allPoints.map(amount => ({
        assetIn: tokenPair.tokenA,
        assetOut: tokenPair.tokenB,
        amount: amount.toString(),
        tradeType: "EXACT_IN" as const,
        protocols: [
            "soroswap", 
            "phoenix",
            "aqua",
            "sdex"
        ],
        slippageBps: "50",
        parts: 10,
        maxHops: 2,
        assetList: ["SOROSWAP", "STELLAR_EXPERT"],
        feeBps: 50
    }));
    
    // Get all quotes simultaneously
    const quotePromises = quoteRequests.map(async (request, index) => {
        try {
            const quote = await getQuote(request);
            return {
                amount: allPoints[index]!,
                quoteResponse: quote,
                success: true
            };
        } catch (error) {
            console.error(`Failed to get quote for amount ${allPoints[index]}:`, error);
            return {
                amount: allPoints[index]!,
                quoteResponse: null,
                success: false
            };
        }
    });
    
    // Wait for all quotes to complete
    const results = await Promise.all(quotePromises);
    
    // Filter successful quotes and create data points
    const quoteDataPoints: QuoteDataPoint[] = [];
    
    results
        .filter(result => result.success && result.quoteResponse)
        .forEach(result => {
            quoteDataPoints.push({
                amount: result.amount,
                amountOut: result.quoteResponse!.amountOut
            });
        });
    
    // Sort by amount in ascending order
    const sortedQuoteDataPoints = quoteDataPoints.sort((a, b) => a.amount - b.amount);
    
    console.log(`Successfully got quotes for ${sortedQuoteDataPoints.length}/${allPoints.length} points`);
    
    return sortedQuoteDataPoints;
}




/**
 * Tests aggregator consistency by querying the same points at regular intervals
 * 
 * @param tokenPair - The token pair to test
 * @param allPoints - Array of amounts to test
 * @param intervalSeconds - Time interval between queries in seconds
 * @param numIterations - Number of iterations to run
 */
async function testAggregatorConsistency(
    tokenPair: TokenPair,
    allPoints: number[],
    intervalSeconds: number = 30,
    numIterations: number = 5
) {
    console.log("=== TESTING AGGREGATOR CONSISTENCY ===");
    console.log(`Token Pair: ${tokenPair.tokenA} -> ${tokenPair.tokenB}`);
    console.log(`Points to test: ${allPoints.length}`);
    console.log(`Interval: ${intervalSeconds} seconds`);
    console.log(`Iterations: ${numIterations}\n`);
    
    const results: Array<{
        iteration: number;
        timestamp: Date;
        quotes: QuoteDataPoint[];
        maxVariation: number;
        avgVariation: number;
    }> = [];
    
    let previousQuotes: QuoteDataPoint[] | null = null;
    
    for (let iteration = 1; iteration <= numIterations; iteration++) {
        console.log(`\n🔄 Iteration ${iteration}/${numIterations} - ${new Date().toLocaleTimeString()}`);
        
        // Get quotes for all points
        const startTime = Date.now();
        const currentQuotes = await getSoroswapQuotesForAllPoints(tokenPair, allPoints);
        const endTime = Date.now();
        
        console.log(`⏱️  Quote fetching completed in ${(endTime - startTime) / 1000}s`);
        
        // Display quotes for current iteration
        console.log("\n📊 Current Iteration Quotes:");
        currentQuotes.forEach((quote, index) => {
            const rate = quote.amountOut / quote.amount;
            console.log(`  ${index + 1}: ${quote.amount.toLocaleString()} -> ${quote.amountOut.toLocaleString()} (rate: ${rate.toFixed(6)})`);
        });
        

        
        let maxVariation = 0;
        let totalVariation = 0;
        let variationCount = 0;
        
        // Compare with previous iteration if available
        if (previousQuotes && currentQuotes.length > 0) {
            console.log("\n📊 Comparing with previous iteration:");
            
            // Display side-by-side comparison
            console.log("  Amount\t\tPrevious Quote\t\tCurrent Quote\t\tVariation");
            console.log("  " + "─".repeat(80));
            
            for (const currentQuote of currentQuotes) {
                const previousQuote = previousQuotes.find(q => q.amount === currentQuote.amount);
                
                if (previousQuote) {
                    const variation = Math.abs(currentQuote.amountOut - previousQuote.amountOut) / previousQuote.amountOut * 100;
                    maxVariation = Math.max(maxVariation, variation);
                    totalVariation += variation;
                    variationCount++;
                    
                    const variationSymbol = variation > 0.1 ? "⚠️" : "  ";
                    console.log(`  ${variationSymbol} ${currentQuote.amount.toLocaleString().padEnd(12)}\t${previousQuote.amountOut.toLocaleString().padEnd(16)}\t${currentQuote.amountOut.toLocaleString().padEnd(16)}\t${variation.toFixed(4)}%`);
                }
            }
            
            const avgVariation = variationCount > 0 ? totalVariation / variationCount : 0;
            console.log(`\n📈 Variation Summary:`);
            console.log(`  Max variation: ${maxVariation.toFixed(4)}%`);
            console.log(`  Average variation: ${avgVariation.toFixed(4)}%`);
            console.log(`  Points compared: ${variationCount}`);
            
            results.push({
                iteration,
                timestamp: new Date(),
                quotes: currentQuotes,
                maxVariation,
                avgVariation
            });
        } else {
            console.log("📝 First iteration - no comparison available");
            results.push({
                iteration,
                timestamp: new Date(),
                quotes: currentQuotes,
                maxVariation: 0,
                avgVariation: 0
            });
        }
        
        // Store current quotes for next iteration
        previousQuotes = currentQuotes;
        
        // Wait for next iteration (except for the last one)
        if (iteration < numIterations) {
            console.log(`\n⏳ Waiting ${intervalSeconds} seconds before next iteration...`);
            await delay(intervalSeconds * 1000);
        }
    }
    
    // Final analysis
    console.log("\n" + "=".repeat(60));
    console.log("📊 FINAL CONSISTENCY ANALYSIS");
    console.log("=".repeat(60));
    
    const variations = results.filter(r => r.maxVariation > 0);
    if (variations.length > 0) {
        const maxOverallVariation = Math.max(...variations.map(r => r.maxVariation));
        const avgOverallVariation = variations.reduce((sum, r) => sum + r.avgVariation, 0) / variations.length;
        
        console.log(`Total iterations: ${results.length}`);
        console.log(`Iterations with variations: ${variations.length}`);
        console.log(`Overall max variation: ${maxOverallVariation.toFixed(4)}%`);
        console.log(`Overall average variation: ${avgOverallVariation.toFixed(4)}%`);
        
        if (maxOverallVariation > 1) {
            console.log("\n🚨 HIGH VARIATION DETECTED!");
            console.log("   • Aggregator quotes are inconsistent");
            console.log("   • This may affect interpolation accuracy");
            console.log("   • Consider using time-weighted averages");
        } else if (maxOverallVariation > 0.1) {
            console.log("\n⚠️  MODERATE VARIATION DETECTED");
            console.log("   • Some variation in aggregator quotes");
            console.log("   • May need to account for price volatility");
        } else {
            console.log("\n✅ CONSISTENT AGGREGATOR");
            console.log("   • Very stable quotes across iterations");
            console.log("   • Good for interpolation analysis");
        }
    } else {
        console.log("✅ No variations detected across iterations");
    }
    
    // Show detailed results
    console.log("\n📋 Detailed Results:");
    results.forEach((result, index) => {
        if (index > 0) { // Skip first iteration (no comparison)
            console.log(`  Iteration ${result.iteration}: Max=${result.maxVariation.toFixed(4)}%, Avg=${result.avgVariation.toFixed(4)}%`);
        }
    });
    
    return results;
}

export async function runSoroswap() {
    const tokenPairs = await getSoroswapTokenPairs("soroswap");
    const maxAmount = 10000000*250000;
    const numberOfDataPoints = 36;
    const testPointOffsetPercentage = 50;
    // if (tokenPairs.length > 0) {
    //     const points = generatePointsForAnalysis(10000000*25000, 2, 15);
    //     await testAggregatorConsistency(tokenPairs[0]!, points.allPoints, 10, 3); // 10s intervals, 3 iterations
    // }
    
    // Uncomment to test point generation and quotes
}


