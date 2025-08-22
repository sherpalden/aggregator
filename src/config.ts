import dotenv from "dotenv";

dotenv.config();

export const config = {
    SOROSWAP_API_KEY: process.env.SOROSWAP_API_KEY || "",
    SOROSWAP_USDC_TOKEN: 'CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75',
}