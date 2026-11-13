import type { Route } from "./mock-server";

/** USDC on Ethereum (checksummed) and on Solana. */
export const USDC_CONTRACT = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
export const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
export const USDC_ID = "ethereum/erc20/usd__coin";

function calToken(id: string, contract: string, standard: string) {
  return [
    {
      id,
      contract_address: contract,
      standard,
      decimals: 6,
      delisted: false,
      name: "USD Coin",
      ticker: "USDC",
      units: [{ code: "USDC", name: "USDC", magnitude: 6 }],
    },
  ];
}

/** CAL routes that know USDC on Ethereum (by contract or id) and on Solana, and no other token. */
export const CAL_KNOWS_USDC: Route[] = [
  {
    method: "GET",
    match: new RegExp(`/v1/tokens.*contract_address=${USDC_CONTRACT}`, "i"),
    response: calToken(USDC_ID, USDC_CONTRACT, "erc20"),
  },
  {
    method: "GET",
    match: new RegExp(`/v1/tokens.*contract_address=${USDC_MINT}`),
    response: calToken(`solana/spl/${USDC_MINT.toLowerCase()}`, USDC_MINT, "spl"),
  },
  {
    method: "GET",
    match: new RegExp(`/v1/tokens.*[?&]id=${encodeURIComponent(USDC_ID)}`, "i"),
    response: calToken(USDC_ID, USDC_CONTRACT, "erc20"),
  },
  { method: "GET", match: /\/v1\/tokens/, response: [] },
];
