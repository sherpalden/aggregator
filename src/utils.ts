

export function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


/**
 * Generates data points, test points, and combined points for interpolation analysis
 * 
 * @param minAmount - Minimum amount to test
 * @param maxAmount - Maximum amount to test
 * @param numberOfDataPoints - Number of data points to generate
 * @param testPointOffsetPercentage - Percentage above each data point to create test points
 * @returns Object containing dataPoints, testPoints, and allPoints arrays
 */
export function generatePointsForAnalysis(
    minAmount: number,
    maxAmount: number,
    numberOfDataPoints: number, 
    testPointOffsetPercentages: number[],
): {
    dataPoints: number[];
    testPoints: number[];
    allPoints: number[];
} {
    const dataPoints: number[] = generateLogarithmicDataPoints(minAmount, maxAmount, numberOfDataPoints);
    const allPoints: number[] = [...dataPoints]; // Create a copy, not a reference
    const testPoints: number[] = [];

    for (const testPointOffsetPercentage of testPointOffsetPercentages) {
        for (let i = 0; i < dataPoints.length - 1; i++) {
            const intAmt = dataPoints[i+1]!- dataPoints[i]!
            const testPoint = dataPoints[i]! + (intAmt * testPointOffsetPercentage) / 100;

            if (!dataPoints.includes(testPoint)) {
                testPoints.push(testPoint);
                allPoints.push(testPoint);
            }
        }
    }

    // Sort all points in ascending order
    allPoints.sort((a, b) => a - b);
    dataPoints.sort((a, b) => a - b);
    testPoints.sort((a, b) => a - b);

    return {
        dataPoints,
        testPoints,
        allPoints
    };
}



/**
 * Generates logarithmic data points for interpolation analysis
 * 
 * @param minAmount - Minimum amount to test
 * @param maxAmount - Maximum amount to test
 * @param numberOfDataPoints - Number of data points to generate
 * @returns Array of logarithmically spaced data points
 */
export function generateLogarithmicDataPoints(
    minAmount: number,
    maxAmount: number,
    numberOfDataPoints: number
): number[] {
    if (minAmount <= 0 || maxAmount <= 0 || minAmount >= maxAmount) {
        throw new Error("Invalid parameters: minAmount and maxAmount must be positive and minAmount < maxAmount");
    }
    
    if (numberOfDataPoints < 2) {
        throw new Error("numberOfDataPoints must be at least 2");
    }
    
    const dataPoints: number[] = [];
    
    // Use logarithmic spacing: next = current * growth_factor
    const growthFactor = Math.pow(maxAmount / minAmount, 1 / (numberOfDataPoints - 1));
    
    for (let i = 0; i < numberOfDataPoints; i++) {
        const dataPoint = minAmount * Math.pow(growthFactor, i);
        dataPoints.push(Math.round(dataPoint)); // Round to avoid floating point precision issues
    }
    
    return dataPoints;
}