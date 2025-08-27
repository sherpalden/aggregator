import { AggregatorClient } from "@cetusprotocol/aggregator-sdk"
import { BN } from "bn.js"
import type { QuoteDataPoint, TokenPair } from './types.js';

interface CetusQuoteRequest {
    from: string;
    target: string;
    amount: InstanceType<typeof BN>;
    byAmountIn: boolean;
}

interface CetusQuoteResponse {
    amountIn: string;
    amountOut: number;
    priceImpactPct: string;
    routePlan: any[];
}


async function getCetusRouter(amount: InstanceType<typeof BN>, from: string, target: string) {
  const client = new AggregatorClient({})
  const routers = await client.findRouters({
    from,
    target,
    amount,
    byAmountIn: true,
  })

  return routers
}

async function getCetusQuote(request: CetusQuoteRequest): Promise<CetusQuoteResponse> {
    const client = new AggregatorClient({});
    const routers = await client.findRouters({
        from: request.from,
        target: request.target,
        amount: request.amount,
        byAmountIn: request.byAmountIn,
    });

    if (!routers) {
        throw new Error('No routers found for the given request');
    }

    // Use the router data directly
    return {
        amountIn: routers.amountIn.toString(),
        amountOut: Number(routers.amountOut),
        priceImpactPct: "0", // Default value since it might not be available
        routePlan: [] // Default empty array since it might not be available
    };
}

/**
 * Gets quotes for all points simultaneously using Cetus aggregator
 * 
 * @param tokenPair - The token pair to get quotes for
 * @param allPoints - Array of amounts to get quotes for
 * @returns Promise<QuoteDataPoint[]> - Array of quote data points
 */
async function getQuotesForAllPoints(
    tokenPair: TokenPair, 
    allPoints: number[]
): Promise<QuoteDataPoint[]> {
    // Create all quote requests
    const quoteRequests = allPoints.map(amount => ({
        from: tokenPair.tokenA,
        target: tokenPair.tokenB,
        amount: new BN(amount),
        byAmountIn: true
    }));
    
    // Get all quotes simultaneously
    const quotePromises = quoteRequests.map(async (request, index) => {
        try {
            const quote = await getCetusQuote(request);
            return {
                amount: allPoints[index]!,
                quoteResponse: quote,
                success: true
            };
        } catch (error) {
            console.error(`Failed to get Cetus quote for amount ${allPoints[index]}:`, error);
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
    
    return sortedQuoteDataPoints;
}



export { getCetusRouter, getCetusQuote, getQuotesForAllPoints };