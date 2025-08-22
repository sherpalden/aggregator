

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
    testPointOffsetPercentage: number
): {
    dataPoints: number[];
    testPoints: number[];
    allPoints: number[];
} {
    const dataPoints: number[] = [];
    const testPoints: number[] = [];
    const allPoints: number[] = [];
    
    // Generate data points with precise positioning between min and max
    const stepSize = (maxAmount - minAmount) / (numberOfDataPoints - 1);
    for (let i = 0; i < numberOfDataPoints; i++) {
        const dataPoint = Math.round(minAmount + (stepSize * i));
        dataPoints.push(dataPoint);
        allPoints.push(dataPoint);
    }
    
    // Generate test points with precise offset calculation
    const intervalAmount = dataPoints[1]! - dataPoints[0]!;
    for (let i = 0; i < dataPoints.length - 1; i++) {
        const baseAmount = dataPoints[i]!;
        
        const offsetAmount = Math.round(intervalAmount * (testPointOffsetPercentage / 100));
        const testAmount = baseAmount + offsetAmount;
        
        if (testAmount <= maxAmount) {
            testPoints.push(testAmount);
            allPoints.push(testAmount);
        }
    }
    
    // Sort all points in ascending order
    allPoints.sort((a, b) => a - b);
    
    return {
        dataPoints,
        testPoints,
        allPoints
    };
}
