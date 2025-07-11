import { UniswapSupportedCommand } from "./types";
import { UNIVERSAL_ROUTER_ADDRESS, UniversalRouterVersion } from "@uniswap/universal-router-sdk";

export const UNISWAP_EXECUTE_SELECTOR = "0x3593564c";

// Use UNIVERSAL_ROUTER_ADDRESS from SDK with version V1_2
export const UNISWAP_UNIVERSAL_ROUTER_ADDRESS = {
  // Ethereum Mainnet
  1: UNIVERSAL_ROUTER_ADDRESS(UniversalRouterVersion.V1_2, 1),
  // Ethereum Goerli
  5: UNIVERSAL_ROUTER_ADDRESS(UniversalRouterVersion.V1_2, 5),
  // Ethereum Sepolia
  11155111: UNIVERSAL_ROUTER_ADDRESS(UniversalRouterVersion.V1_2, 11155111),
  // Arbitrum One
  42161: UNIVERSAL_ROUTER_ADDRESS(UniversalRouterVersion.V1_2, 42161),
  // Arbitrum Goerli
  421613: UNIVERSAL_ROUTER_ADDRESS(UniversalRouterVersion.V1_2, 421613),
  // Avalanche C-Chain
  43114: UNIVERSAL_ROUTER_ADDRESS(UniversalRouterVersion.V1_2, 43114),
  // BSC
  56: UNIVERSAL_ROUTER_ADDRESS(UniversalRouterVersion.V1_2, 56),
  // Base
  8453: UNIVERSAL_ROUTER_ADDRESS(UniversalRouterVersion.V1_2, 8453),
  // Base Goerli
  84531: UNIVERSAL_ROUTER_ADDRESS(UniversalRouterVersion.V1_2, 84531),
  // Blast
  23888: UNIVERSAL_ROUTER_ADDRESS(UniversalRouterVersion.V1_2, 23888),
  // Celo
  42220: UNIVERSAL_ROUTER_ADDRESS(UniversalRouterVersion.V1_2, 42220),
  // Celo Alfajores
  44787: UNIVERSAL_ROUTER_ADDRESS(UniversalRouterVersion.V1_2, 44787),
  // Optimism
  10: UNIVERSAL_ROUTER_ADDRESS(UniversalRouterVersion.V1_2, 10),
  // Optimism Goerli
  420: UNIVERSAL_ROUTER_ADDRESS(UniversalRouterVersion.V1_2, 420),
  // Polygon
  137: UNIVERSAL_ROUTER_ADDRESS(UniversalRouterVersion.V1_2, 137),
  // Polygon Mumbai
  80001: UNIVERSAL_ROUTER_ADDRESS(UniversalRouterVersion.V1_2, 80001),
};

export const WETH_PER_CHAIN_ID = {
  // Ethereum Mainnet
  1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  // Ethereum Goerli
  5: "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6",
  // Ethereum Sepolia
  11155111: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
  // Arbitrum One
  42161: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
  // Arbitrum Goerli
  421613: "0xe39Ab88f8A4777030A534146A9Ca3B52bd5D43A3",
  // Avalanche C-Chain
  43114: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",
  // BSC
  56: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
  // Base
  8453: "0x4200000000000000000000000000000000000006",
  // Base Goerli
  84531: "0x44D627f900da8AdaC7561bD73aA745F132450798",
  // Blast
  23888: "0x4300000000000000000000000000000000000004",
  // Celo
  42220: new Error("Celo isn't supporting wrapping Eth"),
  // Celo Alfajores
  44787: new Error("Celo Alfajores isn't supporting wrapping Eth"),
  // Optimism
  10: "0x4200000000000000000000000000000000000006",
  // Optimism Goerli
  420: "0x4200000000000000000000000000000000000006",
  // Polygon
  137: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
  // Polygon Mumbai
  80001: "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889",
};

export const UNISWAP_COMMANDS: Record<`0x${string}`, UniswapSupportedCommand> = {
  "0x08": "V2_SWAP_EXACT_IN",
  "0x09": "V2_SWAP_EXACT_OUT",
  "0x00": "V3_SWAP_EXACT_IN",
  "0x01": "V3_SWAP_EXACT_OUT",
  "0x0b": "WRAP_ETH",
  "0x0c": "UNWRAP_ETH",
  "0x0a": "PERMIT2_PERMIT",
  "0x0d": "PERMIT2_TRANSFER_FROM",
  "0x02": "PERMIT2_PERMIT_BATCH",
  "0x03": "PERMIT2_TRANSFER_FROM_BATCH",
  "0x06": "PAY_PORTION",
  "0x04": "SWEEP",
};

export const SWAP_COMMANDS: Partial<UniswapSupportedCommand>[] = [
  "V2_SWAP_EXACT_IN",
  "V2_SWAP_EXACT_OUT",
  "V3_SWAP_EXACT_IN",
  "V3_SWAP_EXACT_OUT",
] as const;
