# Linear Interpolation Method For Aggregator Quote Estimation

## Objective

For a given pair of tokens, generate a list of quotes for a set of amounts that need to be cached.
Based on these cached quotes, determine the quote for the amount requested by the user using an interpolation method.

## Testing Summary

| Token Pair | Min Amount | Max Amount | Data Points | Test Points | % Error ≤ 0.02% |
| ---------- | ---------- | ---------- | ----------- | ----------- | --------------- |
| AFSUI-USDC | 1 AFSUI    | 5K AFSUI   | 6           | 80          | 100.00%         |
| AFSUI-USDC | 1 AFSUI    | 10K AFSUI  | 6           | 80          | 100.00%         |
| AFSUI-USDC | 1 AFSUI    | 20K AFSUI  | 6           | 80          | 95.00%          |
| AFSUI-USDC | 1 AFSUI    | 40K AFSUI  | 6           | 80          | 85.00%          |
| AFSUI-USDC | 1 AFSUI    | 80K AFSUI  | 6           | 80          | 78.75%          |
| HASUI-USDC | 1 HASUI    | 5K HASUI   | 6           | 80          | 100.00%         |
| HASUI-USDC | 1 HASUI    | 10K HASUI  | 6           | 80          | 92.50%          |
| HASUI-USDC | 1 HASUI    | 20K HASUI  | 6           | 80          | 95.00%          |
| HASUI-USDC | 1 HASUI    | 40K HASUI  | 6           | 80          | 91.25%          |
| HASUI-USDC | 1 HASUI    | 80K HASUI  | 6           | 80          | 82.50%          |
| CERT-USDC  | 1 CERT     | 5K CERT    | 6           | 80          | 100.00%         |
| CERT-USDC  | 1 CERT     | 10K CERT   | 6           | 80          | 98.75%          |
| CERT-USDC  | 1 CERT     | 20K CERT   | 6           | 80          | 100.00%         |
| CERT-USDC  | 1 CERT     | 40K CERT   | 6           | 80          | 92.50%          |
| CERT-USDC  | 1 CERT     | 80K CERT   | 6           | 80          | 96.25%          |
| SUI-USDC   | 1 SUI      | 5K SUI     | 6           | 80          | 97.50%          |
| SUI-USDC   | 1 SUI      | 10K SUI    | 6           | 80          | 98.75%          |
| SUI-USDC   | 1 SUI      | 20K SUI    | 6           | 80          | 91.25%          |
| SUI-USDC   | 1 SUI      | 40K SUI    | 6           | 80          | 80.00%          |
| SUI-USDC   | 1 SUI      | 80K SUI    | 6           | 80          | 71.25%          |
| SCA-USDC   | 1 SCA      | 10K SCA    | 6           | 80          | 71.25%          |
| SCA-USDC   | 1 SCA      | 20K SCA    | 6           | 80          | 71.25%          |
| SCA-USDC   | 1 SCA      | 40K SCA    | 6           | 80          | 70.00%          |
| SCA-USDC   | 1 SCA      | 80K SCA    | 6           | 80          | 58.75%          |
| SCA-USDC   | 1 SCA      | 160K SCA   | 6           | 80          | 35.00%          |
| CETUS-USDC | 1 CETUS    | 10K CETUS  | 6           | 80          | 28.75%          |
| CETUS-USDC | 1 CETUS    | 20K CETUS  | 6           | 80          | 72.50%          |
| CETUS-USDC | 1 CETUS    | 40K CETUS  | 6           | 80          | 63.75%          |
| CETUS-USDC | 1 CETUS    | 80K CETUS  | 6           | 80          | 57.50%          |
| CETUS-USDC | 1 CETUS    | 160K CETUS | 6           | 80          | 51.25%          |

**Notes:**

- The test is performed across different ranges of maximum amounts for each token pair. Data points are logarithmically spaced with 6 units. The test points were generated using this set of offset percentages in each interval of data points:
  ```
  [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 30, 45, 60, 75, 90, 98]
  ```
- The minimum amount is consistently 1 token across all configurations (1 token = 1,000,000,000 raw units).
- The error threshold is 0.02% - points with error ≤ 0.02% are considered accurate.

## Observations

- Results show that linear interpolation accuracy decreases as the range (maximum amount) increases while keeping the same number of data points.
- Accuracy also depends on how stable and liquid the pair is: highly liquid and stable pairs result in better accuracy.
- Accuracy further depends on the number of data points cached for interpolation. For the same amount range, accuracy increases as we increase the number of data points.

## Inference

- The viability of the linear interpolation approach depends on and is constrained by the following factors:
  - **Maximum amount to be supported**: The higher the amount range, the more data points we need, which means more RPC calls per second while updating the cache. Since RPC calls have rate limits, we are always constrained by the upper limit of the maximum amount.
  - **Liquidity of the pair**: From the observations, we see that less liquid pairs have more error, resulting in the need for more data points to decrease the error.
  - **Number of pairs we support**: As we increase the number of pairs, we need more quotes to be cached, which means more RPC calls.

## Conclusion

- If we can limit our requirements to a few token pairs with reasonable maximum amounts per token, the approach is viable. However, if we need to scale in terms of both pairs and maximum amounts, the approach is clearly not viable.

## Alternatives

- **Simulate quotes using liquidity information from DEXes**: Use the aggregator only for execution. This way, we get the benefits of the aggregator while maintaining scalability. The challenge here is that we need knowledge of many DEXes and need to implement most of them.
