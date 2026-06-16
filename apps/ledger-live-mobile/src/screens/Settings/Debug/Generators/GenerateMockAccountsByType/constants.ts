import { listSupportedCurrencies } from "@ledgerhq/live-common/currencies/index";

/**
 * Stablecoin token IDs grouped by parent network.
 *
 * IDs must be present in the mock framework's hardcodedMarketcap list so they
 * are automatically included as sub-accounts when tokensData is provided to genAccount.
 */
export const STABLECOIN_TOKENS_BY_NETWORK = {
  ethereum: [
    "ethereum/erc20/usd__coin", // USDC
    "ethereum/erc20/usd_tether__erc20_", // USDT
    "ethereum/erc20/dai_stablecoin_v2_0", // DAI v2
    "ethereum/erc20/dai_stablecoin_v1_0", // DAI v1
    "ethereum/erc20/trueusd", // TrueUSD
    "ethereum/erc20/paxos_standard__pax_", // PAX
    "ethereum/erc20/stasis_eurs_token", // EURS
  ],
  tron: [
    "tron/trc20/TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7", // TRC-20 stablecoin
  ],
  algorand: [
    "algorand/asa/312769", // ASA stablecoin
    "algorand/asa/163650", // ASA stablecoin
  ],
} as const;

export const ALL_STABLECOIN_IDS = [
  ...STABLECOIN_TOKENS_BY_NETWORK.ethereum,
  ...STABLECOIN_TOKENS_BY_NETWORK.tron,
  ...STABLECOIN_TOKENS_BY_NETWORK.algorand,
] as const;

export const MAX_STOCK_TOKENS = 20;

const allCurrencies = listSupportedCurrencies();

export const MAINNET_CURRENCIES = allCurrencies.filter(c => !c.isTestnetFor);
export const TESTNET_CURRENCIES = allCurrencies.filter(c => !!c.isTestnetFor);

export const STABLECOIN_PARENT_CURRENCY_IDS = Object.keys(
  STABLECOIN_TOKENS_BY_NETWORK,
) as (keyof typeof STABLECOIN_TOKENS_BY_NETWORK)[];

export function findCurrencyById(id: string) {
  return allCurrencies.find(c => c.id === id);
}
