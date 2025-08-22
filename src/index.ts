import { getCetusTokenPairs, getQuotesForAllPoints } from "./cetus.js";
import { powerLawInterpolate, interpolateMultiple, linearInterpolate } from "./interpolation.js";
import { getSoroswapTokenPairs, getSoroswapQuotesForAllPoints } from "./soroswap.js";
import type { QuoteDataPoint, TokenPair } from "./types.js";
import { generatePointsForAnalysis } from "./utils.js";

/**
 * Test function to demonstrate the point generation and quote fetching
 */
async function testPointGenerationAndQuotes(
  tokenPair: TokenPair,
  minAmount: number,
  maxAmount: number,
  numberOfDataPoints: number,
  testPointOffsetPercentage: number,
  quoteGetter: (tokenPair: TokenPair, points: number[]) => Promise<QuoteDataPoint[]>,
  interpolationFunction: (dataPoints: QuoteDataPoint[], testAmount: number) => number
) {
  console.log("=== TESTING POINT GENERATION AND QUOTE FETCHING ===");
  
  console.log(`Min Amount: ${minAmount.toLocaleString()}`);
  console.log(`Max Amount: ${maxAmount.toLocaleString()}`);
  console.log(`Number of Data Points: ${numberOfDataPoints}`);
  console.log(`Test Point Offset: ${testPointOffsetPercentage}%\n`);
    
  // Generate points
  const pointsResult = generatePointsForAnalysis(minAmount, maxAmount, numberOfDataPoints, testPointOffsetPercentage);
  
  console.log("📊 Data Points:");
  pointsResult.dataPoints.forEach((point, index) => {
      console.log(`  ${index + 1}: ${point.toLocaleString()}`);
  });
  
  console.log("\n🧪 Test Points:");
  pointsResult.testPoints.forEach((point, index) => {
      console.log(`  ${index + 1}: ${point.toLocaleString()}`);
  });
  
  console.log("\n📈 All Points (sorted):");
  pointsResult.allPoints.forEach((point, index) => {
      const isDataPoint = pointsResult.dataPoints.includes(point);
      const isTestPoint = pointsResult.testPoints.includes(point);
      let type = "";
      if (isDataPoint && isTestPoint) type = " (Data + Test)";
      else if (isDataPoint) type = " (Data)";
      else if (isTestPoint) type = " (Test)";
      
      console.log(`  ${index + 1}: ${point.toLocaleString()}${type}`);
  });
  
  console.log(`\n📋 Summary:`);
  console.log(`  Data Points: ${pointsResult.dataPoints.length}`);
  console.log(`  Test Points: ${pointsResult.testPoints.length}`);
  console.log(`  Total Points: ${pointsResult.allPoints.length}`);
  
  // Get quotes for all points
  console.log("\n" + "=".repeat(50));
  console.log("🔍 GETTING QUOTES FOR ALL POINTS");
  console.log("=".repeat(50));
  
  console.log(`Token Pair: ${tokenPair.tokenA} -> ${tokenPair.tokenB}\n`);
  
  const startTime = Date.now();
  const quoteDataPoints = await quoteGetter(tokenPair, pointsResult.allPoints);
  const endTime = Date.now();
  
  console.log(`\n⏱️  Quote fetching completed in ${(endTime - startTime) / 1000}s`);
  
  console.log("\n📊 Quote Results (sorted by amount):");
  quoteDataPoints.forEach((point, index) => {
      const rate = point.amountOut / point.amount;
      console.log(`  ${index + 1}: ${point.amount.toLocaleString()} -> ${point.amountOut.toLocaleString()} (rate: ${rate.toFixed(6)})`);
  });
  
  console.log(`\n✅ Successfully retrieved ${quoteDataPoints.length} quotes`);
  
  // Test linear interpolation for test points
  console.log("\n" + "=".repeat(50));
  console.log("🧮 TESTING LINEAR INTERPOLATION");
  console.log("=".repeat(50));
  
  // Use only data points for interpolation (NOT test points)
  const dataPointsOnly = quoteDataPoints.filter(point => 
      pointsResult.dataPoints.includes(point.amount)
  );
  
  console.log(`\n🔧 Interpolation Setup:`);
  console.log(`  Data points for interpolation: ${dataPointsOnly.length}`);
  console.log(`  Test points to interpolate: ${pointsResult.testPoints.length}`);
  console.log(`  Total points available: ${quoteDataPoints.length}`);
  
  if (dataPointsOnly.length < 2) {
      console.error("❌ Insufficient data points for interpolation (need at least 2)");
      return;
  }
  
  console.log(`Using ${dataPointsOnly.length} data points for interpolation:`);
  dataPointsOnly.forEach(point => {
      console.log(`  ${point.amount.toLocaleString()} -> ${point.amountOut.toLocaleString()}`);
  });
  
  // Validate that we're not using test points as data points
  const testPointsInData = dataPointsOnly.filter(point => 
      pointsResult.testPoints.includes(point.amount)
  );
  
  if (testPointsInData.length > 0) {
      console.error("❌ ERROR: Test points are being used as data points!");
      console.error("   This will cause circular reference and incorrect interpolation.");
      console.error(`   Found ${testPointsInData.length} test points in data points.`);
      return;
  }
  
  // Perform interpolation for test points
  const interpolationResults = interpolateMultiple(dataPointsOnly, pointsResult.testPoints, interpolationFunction);
  
  console.log("\n📈 Interpolation Results:");
  interpolationResults.forEach((result, index) => {
      console.log(`  Test ${index + 1}: ${result.amount.toLocaleString()} -> ${result.interpolatedValue.toLocaleString()}`);
  });
  
  // Summary in tabular form
  console.log("\n📊 Summary Table:");
  console.log("  Amount\t\tInterpolated\t\tActual\t\t\tError");
  console.log("  " + "─".repeat(80));
  
  const testPointQuotes = quoteDataPoints.filter(point => 
      pointsResult.testPoints.includes(point.amount)
  );
  
  interpolationResults.forEach((interpolated, index) => {
      const actual = testPointQuotes.find(quote => quote.amount === interpolated.amount);
      if (actual) {
          const error = Math.abs(interpolated.interpolatedValue - actual.amountOut) / actual.amountOut * 100;
          console.log(`  ${interpolated.amount.toLocaleString().padEnd(12)}\t${interpolated.interpolatedValue.toLocaleString().padEnd(16)}\t${actual.amountOut.toLocaleString().padEnd(16)}\t${error.toFixed(4)}%`);
      }
  });
}

async function main() {
//   const tokenPair = await getCetusTokenPairs();
//   const minAmount = 867360175282769;
//   const maxAmount = 1080914096572582;

  const tokenPair = await getSoroswapTokenPairs("soroswap");
  const minAmount = 10000000*2500;
  const maxAmount = 10000000*250000;

  const numberOfDataPoints = 12;
  const testPointOffsetPercentage = 50;
  await testPointGenerationAndQuotes(
    tokenPair[0]!, 
    minAmount,
    maxAmount, 
    numberOfDataPoints, 
    testPointOffsetPercentage, 
    // getQuotesForAllPoints, 
    getSoroswapQuotesForAllPoints,
    // powerLawInterpolate,
    linearInterpolate,
  );
}

main();