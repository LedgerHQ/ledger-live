import {
  CryptoCurrencyIdSchema,
  TokenCurrencyIdSchema,
  type TokenCurrency,
} from "@ledgerhq/ledger-wallet-framework/types";

/**
 * Live mainnet accounts for the integ suites. They are third-party addresses, so their state can
 * change at any time. When a precondition below stops holding, replace the address here.
 */

/**
 * Holds `StakedSui` in active validators' pools (9 stakes in 9 pools, oldest from epoch 0), so
 * `delegate` and `estimatedReward` resolve. Not a validator: stake reads list the objects an
 * address owns, and a validator's own address holds none unless its operator self-stakes.
 */
export const STAKE_DELEGATOR = "0x571bad7fd728af0fb5589888e8124214467ae3ba7947cff39dea9d0638e5979a";

/** Holds USDC and enough SUI for dry-run gas. Turns over a 50-item history page in ~7s. */
export const ACTIVE_ACCOUNT = "0x0feb54a725aa357ff2f5bc6bb023c05b310285bd861275a30521f339a434ebb3";

/**
 * Steady, high-volume history: several pages deep on both transports, and a 50-item page spans
 * ~20min, so two back-to-back "newest page" calls still overlap.
 */
export const STEADY_ACCOUNT = "0x6cae00a08b04f6a4ca7157628ccf60f40078616deab20d2b626bd1de7c8a16c9";

/**
 * hBTC: BTC bridged to Sui by Hashi, 8 decimals. The package id changes with each Hashi publish,
 * so the coin type is defined here only.
 */
export const HBTC_COIN_TYPE =
  "0xd30fb3f8914efdbeb7b8e85fae1d65dc584b44a1281f66737b92bb9f03a59d06::btc::BTC";

/**
 * Received 0.001 hBTC from one Hashi deposit, which credits the address balance: the account holds
 * no hBTC coin object. Holds SUI coin objects for dry-run gas.
 */
export const HBTC_HOLDER = "0xab7314c1d9e5f55518078ebb326522ebafd4853c65822e2449309a1b67448b7c";

/** The Hashi deposit that credited {@link HBTC_HOLDER}, and its amount in satoshis. */
export const HBTC_DEPOSIT = {
  digest: "G3d7HHVZrR5zLG2U9MNanZc15tgqANZ5MHbMG6V4CwV9",
  amount: "100000",
};

/** Local stand-in for the hBTC token entry of the crypto-assets list. */
export const HBTC_TOKEN: TokenCurrency = {
  type: "TokenCurrency",
  id: TokenCurrencyIdSchema.parse(`sui/coin/hashi_btc_${HBTC_COIN_TYPE.toLowerCase()}`),
  contractAddress: HBTC_COIN_TYPE,
  parentCurrencyId: CryptoCurrencyIdSchema.parse("sui"),
  tokenType: "coin",
  name: "BTC",
  ticker: "hBTC",
  units: [{ name: "hBTC", code: "hBTC", magnitude: 8 }],
};
