import type { RegistryContractName } from "./network/registry";

/**
 * Maps token tickers to their Celo Registry contract names.
 * These are the identifiers passed to `getRegistryAddressFor`.
 */
const CELO_STAKE_TOKENS_PAIR: Record<string, RegistryContractName> = {
  cEUR: "StableTokenEUR",
  cREAL: "StableTokenBRL",
  cUSD: "StableToken",
};

export const CELO_STABLE_TOKENS = Object.keys(CELO_STAKE_TOKENS_PAIR);

export const getStableTokenRegistryName = (tokenTicker: string): RegistryContractName =>
  CELO_STAKE_TOKENS_PAIR[tokenTicker];

/** Minimum gas for a simple native transfer (EVM standard). */
export const MIN_GAS_FOR_NATIVE_TRANSFER = 21000;

export const MAX_FEES_THRESHOLD_MULTIPLIER = 4;

/**
 * Celo Fee Abstraction — allowlisted fee currencies.
 *
 * Celo's protocol allows users to pay gas in tokens other than the native CELO.
 * The on-chain allowlist is managed by `FeeCurrencyDirectory.sol`.
 *
 * Tokens with fewer than 18 decimals (USDC, USDT) use an **adapter** contract
 * instead of the token address for `feeCurrency`. The adapter normalizes values
 * to 18 decimals so the protocol can price gas consistently. For these tokens:
 *   - `feeCurrency` on the transaction → adapter address
 *   - `contractAddress` (ERC-20 transfer target) → token address
 *
 * Tokens that are natively 18-decimal do not need an adapter and use their own
 * token address for both purposes.
 * This list contains the tokens that are currently supported as fee currencies
 * (CELO, USDT, USDC, and many others). Native 18-decimal tokens such as cUSD or cEUR are not
 * included in the current allowlist.
 *
 * Reference: https://docs.celo.org/protocol/transaction/eip1559
 */
export const FEE_CURRENCY_OPTIONS: {
  name: string;
  contractAddress: `0x${string}` | null;
  adapterAddress: `0x${string}` | null;
}[] = [
  {
    name: "CELO",
    contractAddress: null,
    adapterAddress: null,
  },
  {
    name: "USDT",
    adapterAddress: "0x0e2a3e05bc9a16f5292a6170456a710cb89c6f72",
    contractAddress: "0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e",
  },
  {
    name: "USDC",
    adapterAddress: "0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B",
    contractAddress: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C",
  },
  {
    name: "PHPm",
    adapterAddress: "0x105d4A9306D2E55a71d2Eb95B81553AE1dC20d7B",
    contractAddress: "0x105d4A9306D2E55a71d2Eb95B81553AE1dC20d7B",
  },
  {
    name: "KESm",
    adapterAddress: "0x456a3D042C0DbD3db53D5489e98dFb038553B0d0",
    contractAddress: "0x456a3D042C0DbD3db53D5489e98dFb038553B0d0",
  },
  {
    name: "ZARm",
    adapterAddress: "0x4c35853A3B4e647fD266f4de678dCc8fEC410BF6",
    contractAddress: "0x4c35853A3B4e647fD266f4de678dCc8fEC410BF6",
  },
  {
    name: "AUDm",
    adapterAddress: "0x7175504C455076F15c04A2F90a8e352281F492F9",
    contractAddress: "0x7175504C455076F15c04A2F90a8e352281F492F9",
  },
  {
    name: "XOFm",
    adapterAddress: "0x73F93dcc49cB8A239e2032663e9475dd5ef29A08",
    contractAddress: "0x73F93dcc49cB8A239e2032663e9475dd5ef29A08",
  },
  {
    name: "USDm",
    adapterAddress: "0x765DE816845861e75A25fCA122bb6898B8B1282a",
    contractAddress: "0x765DE816845861e75A25fCA122bb6898B8B1282a",
  },
  {
    name: "COPm",
    adapterAddress: "0x8A567e2aE79CA692Bd748aB832081C45de4041eA",
    contractAddress: "0x8A567e2aE79CA692Bd748aB832081C45de4041eA",
  },
  {
    name: "GBPm",
    adapterAddress: "0xCCF663b1fF11028f0b19058d0f7B674004a40746",
    contractAddress: "0xCCF663b1fF11028f0b19058d0f7B674004a40746",
  },
  {
    name: "WETH",
    adapterAddress: "0xD221812de1BD094f35587EE8E174B07B6167D9Af",
    contractAddress: "0xD221812de1BD094f35587EE8E174B07B6167D9Af",
  },
  {
    name: "EURm",
    adapterAddress: "0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73",
    contractAddress: "0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73",
  },
  {
    name: "NGNm",
    adapterAddress: "0xE2702Bd97ee33c88c8f6f92DA3B733608aa76F71",
    contractAddress: "0xE2702Bd97ee33c88c8f6f92DA3B733608aa76F71",
  },
  {
    name: "CHFm",
    adapterAddress: "0xb55a79F398E759E43C95b979163f30eC87Ee131D",
    contractAddress: "0xb55a79F398E759E43C95b979163f30eC87Ee131D",
  },
  {
    name: "JPYm",
    adapterAddress: "0xc45eCF20f3CD864B32D9794d6f76814aE8892e20",
    contractAddress: "0xc45eCF20f3CD864B32D9794d6f76814aE8892e20",
  },
  {
    name: "BRLm",
    adapterAddress: "0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787",
    contractAddress: "0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787",
  },
  {
    name: "GHSm",
    adapterAddress: "0xfAeA5F3404bbA20D3cc2f8C4B0A888F55a3c7313",
    contractAddress: "0xfAeA5F3404bbA20D3cc2f8C4B0A888F55a3c7313",
  },
  {
    name: "CADm",
    adapterAddress: "0xff4Ab19391af240c311c54200a492233052B6325",
    contractAddress: "0xff4Ab19391af240c311c54200a492233052B6325",
  },
];

/** O(1) lookup of fee currency options by contract address.
 *  Keys are lowercased for case-insensitive matching against token contract addresses. */
export const FEE_CURRENCY_BY_CONTRACT: Map<string, (typeof FEE_CURRENCY_OPTIONS)[number]> = new Map(
  FEE_CURRENCY_OPTIONS.filter(option => option.contractAddress !== null).map(option => [
    option.contractAddress!.toLowerCase(),
    option,
  ]),
);

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
