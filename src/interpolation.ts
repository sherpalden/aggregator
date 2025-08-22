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
    interpolationFunction: (dataPoints: QuoteDataPoint[], testAmount: number) => number
): Array<{ amount: number; interpolatedValue: number }> {
    console.log(`Performing linear interpolation for ${testAmounts.length} test amounts...`);
    
    const results: Array<{ amount: number; interpolatedValue: number }> = [];
    
    for (const testAmount of testAmounts) {
        const interpolatedValue = interpolationFunction(dataPoints, testAmount);
        results.push({
            amount: testAmount,
            interpolatedValue: interpolatedValue
        });
    }
    
    console.log(`Completed interpolation for ${results.length} test amounts`);
    
    return results;
}


export function linearInterpolate(dataPoints: QuoteDataPoint[], targetAmount: number): number {
    // Sort data points by amount
    const sorted = dataPoints.sort((a, b) => a.amount - b.amount);
    
    // Check if we have data points
    if (sorted.length === 0) return 0;
    if (sorted.length === 1) return sorted[0]!.amountOut;
    
    // Handle edge cases with extrapolation
    if (targetAmount <= sorted[0]!.amount) {
        // Extrapolate downward using the slope from first two points
        if (sorted.length >= 2) {
            const p1 = sorted[0]!;
            const p2 = sorted[1]!;
            const slope = (p2.amountOut - p1.amountOut) / (p2.amount - p1.amount);
            return Math.max(0, p1.amountOut + slope * (targetAmount - p1.amount));
        }
        return sorted[0]!.amountOut;
    }
    if (targetAmount >= sorted[sorted.length - 1]!.amount) {
        // Extrapolate upward using the slope from last two points
        if (sorted.length >= 2) {
            const p1 = sorted[sorted.length - 2]!;
            const p2 = sorted[sorted.length - 1]!;
            const slope = (p2.amountOut - p1.amountOut) / (p2.amount - p1.amount);
            return p2.amountOut + slope * (targetAmount - p2.amount);
        }
        return sorted[sorted.length - 1]!.amountOut;
    }
    
    // Find the two points to interpolate between
    for (let i = 0; i < sorted.length - 1; i++) {
        const p1 = sorted[i]!;
        const p2 = sorted[i + 1]!;
        
        if (targetAmount >= p1.amount && targetAmount <= p2.amount) {
            const ratio = (targetAmount - p1.amount) / (p2.amount - p1.amount);
            return p1.amountOut + ratio * (p2.amountOut - p1.amountOut);
        }
    }
    
    return 0; // Should never reach here
}

export function powerLawInterpolate(dataPoints: QuoteDataPoint[], targetAmount: number): number {
    // Sort data points by amount
    const sorted = dataPoints.sort((a, b) => a.amount - b.amount);
    
    // Check if we have enough data points
    if (sorted.length === 0) return 0;
    if (sorted.length === 1) return sorted[0]!.amountOut;
    if (sorted.length < 3) {
        // Fall back to linear interpolation for insufficient data
        return linearInterpolate(sorted, targetAmount);
    }
    
    // Filter out zero values for log calculations
    const validPoints = sorted.filter(p => p.amount > 0 && p.amountOut > 0);
    if (validPoints.length < 3) {
        return linearInterpolate(sorted, targetAmount);
    }
    
    // Fit power law: y = a * x^b using least squares on log-transformed data
    // log(y) = log(a) + b * log(x)
    const n = validPoints.length;
    let sumLogX = 0, sumLogY = 0, sumLogXLogY = 0, sumLogXSquared = 0;
    
    for (const point of validPoints) {
        const logX = Math.log(point.amount);
        const logY = Math.log(point.amountOut);
        sumLogX += logX;
        sumLogY += logY;
        sumLogXLogY += logX * logY;
        sumLogXSquared += logX * logX;
    }
    
    // Calculate b (slope) and log(a) (intercept)
    const b = (n * sumLogXLogY - sumLogX * sumLogY) / (n * sumLogXSquared - sumLogX * sumLogX);
    const logA = (sumLogY - b * sumLogX) / n;
    const a = Math.exp(logA);
    
    // Apply power law: y = a * x^b
    if (targetAmount <= 0) return 0;
    
    // Debug: Log the fitted parameters
    console.log(`    [DEBUG] Power Law fit: a=${a.toFixed(6)}, b=${b.toFixed(6)}`);
    
    return Math.max(0, a * Math.pow(targetAmount, b));
}