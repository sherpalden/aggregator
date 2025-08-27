import type { QuoteDataPoint } from "./types.js";

/**
 * Performs linear interpolation for multiple test amounts using provided data points
 * 
 * @param dataPoints - Array of QuoteDataPoint objects for interpolation
 * @param testAmounts - Array of amounts to interpolate for
 * @returns Array of interpolated results with amount and interpolated value
 */
export function interpolateMultiple(
    dataPoints: QuoteDataPoint[], 
    testAmounts: number[],
    interpolationFunction: (dataPoints: QuoteDataPoint[], testAmount: number) => {interpolatedValue: number, usedDataPoints: QuoteDataPoint[]}
): Array<{ 
    amount: number; 
    interpolatedValue: number; 
    usedDataPoints: QuoteDataPoint[];
}> {
    
    const results: Array<{ amount: number; interpolatedValue: number, usedDataPoints: QuoteDataPoint[] }> = [];
    
    for (const testAmount of testAmounts) {
        const {interpolatedValue, usedDataPoints} = interpolationFunction(dataPoints, testAmount);
        results.push({
            amount: testAmount,
            interpolatedValue: interpolatedValue,
            usedDataPoints: usedDataPoints,
        });
    }
    
    
    return results;
}


export function linearInterpolate(dataPoints: QuoteDataPoint[], targetAmount: number): {interpolatedValue: number, usedDataPoints: QuoteDataPoint[]} {
    const sorted = dataPoints.sort((a, b) => a.amount - b.amount);

    
    if (sorted.length < 2) {
        throw new Error("Not enough data points provided");
    };
    
    for (let i = 0; i < sorted.length - 1; i++) {
        const p1 = sorted[i]!;
        const p2 = sorted[i + 1]!;
        
        if (targetAmount >= p1.amount && targetAmount <= p2.amount) {
            const ratio = (targetAmount - p1.amount) / (p2.amount - p1.amount);
            return {
                interpolatedValue: p1.amountOut + ratio * (p2.amountOut - p1.amountOut),
                usedDataPoints: [p1, p2],
            };
        }
    }
    
    throw new Error("No interpolation points found");
}