import { assetMappingKey, type AssetMappingKey } from "./assetKey";

/**
 * The Ledger currency behind each asset Baanx serves the card from.
 *
 * Baanx's own, not every card provider's: the ids are the ones its endpoints answer with, so a
 * second provider is a second catalog beside this one rather than more keys in it.
 *
 * Several of its keys map onto one Ledger id on purpose. Its documentation names the chain in
 * `network` (`usdt.ethereum`), while its sandbox has answered with the ticker repeated
 * (`usdt.usdt`); both are listed so a wallet resolves whichever form arrives. Adding a form later is
 * one line, and an unlisted one resolves to `undefined` rather than to a wrong currency.
 */
export const BAANX_ASSET_LEDGER_IDS: Readonly<Record<AssetMappingKey, string | undefined>> = {
  "usdt.ethereum": "ethereum/erc20/usd_tether__erc20_",
  "usdt.usdt": "ethereum/erc20/usd_tether__erc20_",

  "usdc.ethereum": "ethereum/erc20/usd__coin",
  "usdc.usdc": "ethereum/erc20/usd__coin",

  "btc.bitcoin": "bitcoin",
  "btc.btc": "bitcoin",

  "eth.ethereum": "ethereum",
  "eth.eth": "ethereum",

  "xrp.ripple": "ripple",
  "xrp.xrp": "ripple",

  "sol.solana": "solana",
  "sol.sol": "solana",

  "ltc.litecoin": "litecoin",
  "ltc.ltc": "litecoin",
};

/**
 * The Ledger currency id for one of Baanx's wallets, or `undefined` when the pair is not one its
 * catalog covers. A caller reports that as unpriced rather than guessing a currency.
 */
export function baanxAssetLedgerId(currency: string, network: string): string | undefined {
  return BAANX_ASSET_LEDGER_IDS[assetMappingKey(currency, network)];
}

/** The provider asset codes behind each Ledger id, read off the catalog rather than listed twice. */
const BAANX_CURRENCIES_BY_LEDGER_ID: ReadonlyMap<string, ReadonlySet<string>> = Object.entries(
  BAANX_ASSET_LEDGER_IDS,
).reduce(
  (byLedgerId, [key, ledgerId]) =>
    ledgerId
      ? byLedgerId.set(ledgerId, (byLedgerId.get(ledgerId) ?? new Set()).add(key.split(".")[0]))
      : byLedgerId,
  new Map<string, Set<string>>(),
);

/**
 * Whether `currency`, as a card provider names it, is the asset `ledgerId` stands for.
 *
 * The way back from a Ledger id, for a caller that only has the provider's asset code: a funding
 * source keeps `currency` and no `network`, so the code is the only join a cached transaction has.
 */
export function isBaanxAssetCurrency(ledgerId: string, currency: string): boolean {
  return BAANX_CURRENCIES_BY_LEDGER_ID.get(ledgerId)?.has(currency.trim().toLowerCase()) ?? false;
}

/** Every distinct Ledger id the catalog resolves to. */
export const BAANX_LEDGER_CURRENCY_IDS: readonly string[] = [
  ...new Set(Object.values(BAANX_ASSET_LEDGER_IDS).filter((id): id is string => id !== undefined)),
];
