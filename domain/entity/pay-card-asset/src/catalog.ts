import { payCardAssetKey, type PayCardAssetKey } from "./assetKey";

/**
 * The Ledger currency behind each asset the Card supports.
 *
 * Several provider keys map onto one Ledger id on purpose. The provider's own documentation names
 * the chain in `network` (`usdt.ethereum`), while its sandbox has answered with the ticker repeated
 * (`usdt.usdt`); both are listed so a wallet resolves whichever form arrives. Adding a form later is
 * one line, and an unlisted one resolves to `undefined` rather than to a wrong currency.
 */
export const PAY_CARD_ASSET_LEDGER_IDS: Readonly<Record<PayCardAssetKey, string>> = {
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
 * The Ledger currency id for one of the provider's wallets, or `undefined` when the pair is not one
 * the catalog covers. A caller reports that as unpriced rather than guessing a currency.
 */
export function payCardAssetLedgerId(currency: string, network: string): string | undefined {
  return PAY_CARD_ASSET_LEDGER_IDS[payCardAssetKey(currency, network)];
}
