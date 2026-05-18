import type { TokenInfo } from "../../wallet/models";

export const USDT_CONTRACT = "0xdac17f958d2ee523a2206206994597c13d831ec7";

export const USDT_API_RESPONSE = [
  {
    id: "ethereum/erc20/usd_tether__erc20_",
    contract_address: USDT_CONTRACT,
    standard: "erc20",
    decimals: 6,
    delisted: false,
    name: "Tether USD",
    ticker: "USDT",
    units: [
      { code: "USDT", name: "USDT", magnitude: 6 },
      { code: "uUSDT", name: "micro USDT", magnitude: 0 },
    ],
  },
];

export const USDT_TOKEN_INFO: TokenInfo = {
  id: "ethereum/erc20/usd_tether__erc20_",
  ticker: "USDT",
  name: "Tether USD",
  contractAddress: USDT_CONTRACT,
  parentCurrencyId: "ethereum",
  tokenType: "erc20",
  decimals: 6,
};
