import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";

export const ethCurrency = getCryptoCurrencyById("ethereum");
export const btcCurrency = getCryptoCurrencyById("bitcoin");

/**
 * Synchronous token fixture — the crypto-assets store requires async init
 * which is unavailable in unit tests, so we build the TokenCurrency by hand.
 */
export const usdtToken: TokenCurrency = {
  type: "TokenCurrency",
  id: "ethereum/erc20/usd_tether__erc20_",
  ticker: "USDT",
  name: "Tether USD",
  parentCurrency: ethCurrency,
  tokenType: "erc20",
  units: [{ name: "USDT", code: "USDT", magnitude: 6 }],
  contractAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  disableCountervalue: false,
  delisted: false,
};
