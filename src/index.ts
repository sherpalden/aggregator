import { getQuotesForAllPoints } from "./cetus.js";
import { cetusTokenPairs } from "./config.js";
import { interpolateMultiple, linearInterpolate } from "./interpolation.js";
import { getSoroswapTokenPairs, getSoroswapQuotesForAllPoints } from "./soroswap.js";
import type { QuoteDataPoint, TokenPair } from "./types.js";
import { delay, generateLogarithmicDataPoints, generatePointsForAnalysis } from "./utils.js";

/**
 * Test function to demonstrate the point generation and quote fetching
 */
async function testPointGenerationAndQuotes(
  tokenPair: TokenPair,
  minAmount: number,
  maxAmount: number,
  numberOfDataPoints: number,
  testPointOffsetPercentages: number[],
  quoteGetter: (tokenPair: TokenPair, points: number[]) => Promise<QuoteDataPoint[]>,
  interpolationFunction: (dataPoints: QuoteDataPoint[], testAmount: number) => {interpolatedValue: number, usedDataPoints: QuoteDataPoint[]}
): Promise<{
  testPointQuotes: QuoteDataPoint[];
  interpolationResults: { amount: number; interpolatedValue: number, usedDataPoints: QuoteDataPoint[] }[];
  }> {
  const {dataPoints, testPoints, allPoints} = generatePointsForAnalysis(minAmount, maxAmount, numberOfDataPoints, testPointOffsetPercentages);

  const allQuotes = await quoteGetter(tokenPair, allPoints);

  const dataPointsQuotes = allQuotes.filter(point => 
      dataPoints.includes(point.amount)
  );
  
  if (dataPointsQuotes.length < 2) {
      console.error("❌ Insufficient data points for interpolation (need at least 2)");
      return {
        testPointQuotes: [],
        interpolationResults: [],
      };
  }
  
  const testPointsInData = dataPointsQuotes.filter(point => 
      testPoints.includes(point.amount)
  );
  
  if (testPointsInData.length > 0) {
      console.error("❌ ERROR: Test points are being used as data points!");
      console.error(`   Found ${testPointsInData.length} test points in data points.`);
      return {
        testPointQuotes: [],
        interpolationResults: [],
      };
  }

  // Perform interpolation for test points
  const interpolationResults = interpolateMultiple(dataPointsQuotes, testPoints, interpolationFunction);
  const testPointQuotes = allQuotes.filter(point => 
      testPoints.includes(point.amount)
  );

  return {
    testPointQuotes,
    interpolationResults,
  }
  
}



async function testCetus(tokenPair: TokenPair, numberOfDataPoints: number, minAmount: number, maxAmount: number) {
  const testPointOffsetPercentages = [
    [2, 3], 
    [5, 7], 
    [11, 13], 
    [17, 19], 
    [23, 29], 
    [30, 45],
    [60, 75],
    [90, 98]
  ];
  

  const testPointQuotesList: QuoteDataPoint[] = [];
  const interpolationResultsList: { amount: number; interpolatedValue: number; usedDataPoints: QuoteDataPoint[] }[] = [];

  for (let i = 0; i < testPointOffsetPercentages.length; i++) {
    const testPointOffsetPercentageGroup = testPointOffsetPercentages[i]!;
    const {
      testPointQuotes, 
      interpolationResults,
    } = await testPointGenerationAndQuotes(
      tokenPair, 
      minAmount,
      maxAmount,
      numberOfDataPoints,
      testPointOffsetPercentageGroup, 
      getQuotesForAllPoints,
      linearInterpolate,
    );
    testPointQuotesList.push(...testPointQuotes);
    interpolationResultsList.push(...interpolationResults);
    await delay(3000);
  }


  // sort both lists by amount
  testPointQuotesList.sort((a, b) => a.amount - b.amount);
  interpolationResultsList.sort((a, b) => a.amount - b.amount);

  displayResults(testPointQuotesList, interpolationResultsList, tokenPair, minAmount, numberOfDataPoints, maxAmount);
}

function displayResults(
  testPointQuotes: QuoteDataPoint[], 
  interpolationResults: { amount: number; interpolatedValue: number; usedDataPoints: QuoteDataPoint[] }[], 
  tokenPair: TokenPair, 
  minAmount: number, 
  numberOfDataPoints: number,
  maxAmount: number,
) {
      // Display summary table
  console.log("\n" + "=".repeat(120));
  console.log("📊 SUMMARY TABLE");
  console.log("=".repeat(120));
  
  // Display configuration information
  console.log("🔧 CONFIGURATION");
  console.log("─".repeat(120));
  console.log(`Token Pair: ${tokenPair.tokenA}/${tokenPair.tokenB}`);
  console.log(`Min Amount: ${minAmount.toLocaleString()}`);
  console.log(`Max Amount: ${maxAmount.toLocaleString()}`);
  console.log(`Number of Data Points: ${numberOfDataPoints}`);
  console.log(`Number of Test Points: ${testPointQuotes.length}`);
  console.log("─".repeat(120));
  
  if (testPointQuotes.length === 0 || interpolationResults.length === 0) {
    console.log("❌ No test results available for summary");
    return;
  }
  
  console.log("Test Point\t\tActual Quote\t\tInterpolated Quote\t\tError (%)\t\tUsed Data Points");
  console.log("─".repeat(120));
  
  interpolationResults.forEach((interpolated) => {
    const actual = testPointQuotes.find(quote => quote.amount === interpolated.amount);
    if (actual) {
      const error = Math.abs(interpolated.interpolatedValue - actual.amountOut) / actual.amountOut * 100;
      const usedPointsStr = interpolated.usedDataPoints.map(p => p.amount.toLocaleString()).join(" & ");
      console.log(`${interpolated.amount.toLocaleString().padEnd(25)}\t${actual.amountOut.toLocaleString().padEnd(16)}\t${interpolated.interpolatedValue.toLocaleString().padEnd(20)}\t${error.toFixed(4)}%\t\t${usedPointsStr}`);
    }
  });
  
  // Calculate and display average error
  const errors: number[] = [];
  interpolationResults.forEach((interpolated) => {
    const actual = testPointQuotes.find(quote => quote.amount === interpolated.amount);
    if (actual) {
      const error = Math.abs(interpolated.interpolatedValue - actual.amountOut) / actual.amountOut * 100;
      errors.push(error);
    }
  });
  
  if (errors.length > 0) {
    const pointsWithLowError = errors.filter(error => error <= 0.02).length;
    console.log("─".repeat(120));
    console.log(`Total Points: ${errors.length}`);
    console.log(`Points with Error ≤ 0.02%: ${pointsWithLowError}/${errors.length} (${((pointsWithLowError / errors.length) * 100).toFixed(2)}%)`);
  }
}


async function main() {
    for (const tokenPair of cetusTokenPairs) {
      for (const maxAmount of tokenPair.maxAmounts) {
        await delay(5000);
        await testCetus(tokenPair, 6, tokenPair.minAmount, maxAmount);
      }
    }
}

main();