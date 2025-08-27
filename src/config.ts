import dotenv from "dotenv";

dotenv.config();

export const config = {
    SOROSWAP_API_KEY: process.env.SOROSWAP_API_KEY || "",
    SOROSWAP_USDC_TOKEN: 'CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75',
}


export const cetusTokenPairs = [
    // {
    //     tokenA: "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI",
    //     tokenB: "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
    //     minAmount: 1 * 1_000_000_000,
    //     maxAmounts: [
    //         5_000 * 1_000_000_000, 
    //         10_000 * 1_000_000_000, 
    //         20_000 * 1_000_000_000, 
    //         40_000 * 1_000_000_000, 
    //         80_000 * 1_000_000_000, 
    //     ],
    // },
    // {
    //     tokenA: "0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS",
    //     tokenB: "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
    //     minAmount: 1 * 1_000_000_000,
    //     maxAmounts: [
    //         10_000 * 1_000_000_000, 
    //         20_000 * 1_000_000_000, 
    //         40_000 * 1_000_000_000, 
    //         80_000 * 1_000_000_000, 
    //         160_000 * 1_000_000_000, 
    //     ],
    // },
    // {
    //     tokenA: "0x7016aae72cfc67f2fadf55769c0a7dd54291a583b63051a5ed71081cce836ac6::sca::SCA",
    //     tokenB: "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
    //     minAmount: 1 * 1_000_000_000,
    //     maxAmounts: [
    //         10_000 * 1_000_000_000, 
    //         20_000 * 1_000_000_000, 
    //         40_000 * 1_000_000_000, 
    //         80_000 * 1_000_000_000, 
    //         160_000 * 1_000_000_000, 
    //     ],
    // },
    {
        tokenA: "0xf325ce1300e8dac124071d3152c5c5ee6174914f8bc2161e88329cf579246efc::afsui::AFSUI",
        tokenB: "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
        minAmount: 1 * 1_000_000_000,
        maxAmounts: [
            5_000 * 1_000_000_000, 
            10_000 * 1_000_000_000, 
            20_000 * 1_000_000_000, 
            40_000 * 1_000_000_000, 
            80_000 * 1_000_000_000, 
        ],
    },
    {
        tokenA: "0xbde4ba4c2e274a60ce15c1cfff9e5c42e41654ac8b6d906a57efa4bd3c29f47d::hasui::HASUI",
        tokenB: "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
        minAmount: 1 * 1_000_000_000,
        maxAmounts: [
            5_000 * 1_000_000_000, 
            10_000 * 1_000_000_000, 
            20_000 * 1_000_000_000, 
            40_000 * 1_000_000_000, 
            80_000 * 1_000_000_000, 
        ],
    },
    {
        tokenA: "0x549e8b69270defbfafd4f94e17ec44cdbdd99820b33bda2278dea3b9a32d3f55::cert::CERT",
        tokenB: "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
        minAmount: 1 * 1_000_000_000,
        maxAmounts: [
            5_000 * 1_000_000_000, 
            10_000 * 1_000_000_000, 
            20_000 * 1_000_000_000, 
            40_000 * 1_000_000_000, 
            80_000 * 1_000_000_000, 
        ],
    },
]