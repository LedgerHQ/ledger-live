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
