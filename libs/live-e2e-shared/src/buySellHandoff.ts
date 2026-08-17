import { BuySell } from "./models/BuySell";
import { BuySellProvider } from "./enum/Provider";
import { OperationType } from "./enum/OperationType";

/**
 * Helpers for asserting the Buy/Sell **handoff** contract: the Ledger-owned webview URL
 * that carries `goToURL=<partner url>` when the user is sent off to a partner.
 *
 * This handoff is the boundary Ledger Live actually owns. Asserting here keeps the tests
 * off the partner's own production page, which is third-party, uncontrolled, and - on the
 * Android CI emulator's software renderer - heavy enough to take the emulator down
 * mid-test. Mirrors what e2e/desktop reads out of `webviewUrlHistory`.
 */

/** Some partners are named differently in their own URLs than in the quote list. */
const providerUrlAliases: Record<string, string> = {
  [BuySellProvider.MERCURYO.uiName]: "mrcr",
};

type ParamExpectations = Record<string, (buySell: BuySell) => string | number>;

const standardSellParams: ParamExpectations = {
  cryptoAmount: buySell => buySell.amount,
  cryptoCurrency: buySell => buySell.crypto.currency.ticker,
  fiatCurrency: buySell => buySell.fiat.currencyTicker,
};

/** Only partners with a known, stable URL contract are asserted param-by-param. */
const providerUrlConfigs: Record<
  string,
  { buyParams: ParamExpectations; sellParams: ParamExpectations }
> = {
  [BuySellProvider.MOONPAY.uiName]: {
    buyParams: {
      baseCurrencyAmount: buySell => buySell.amount,
      currencyCode: buySell => buySell.crypto.currency.ticker,
      baseCurrencyCode: buySell => buySell.fiat.currencyTicker,
    },
    sellParams: standardSellParams,
  },
};

const alphanumeric = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Pulls the partner URL out of a handoff URL's `goToURL` param. */
export function extractGoToUrl(rawHandoffUrl: string): string {
  const match = rawHandoffUrl.match(/gotourl=([^&]+)/i);
  if (!match) throw new Error(`Missing 'goToURL' param in handoff URL:\n${rawHandoffUrl}`);
  return decodeURIComponent(match[1]);
}

/** True when the partner URL identifies `provider` (punctuation-insensitive, alias-aware). */
export function urlMatchesProvider(partnerUrl: string, provider: BuySellProvider): boolean {
  const expected = alphanumeric(providerUrlAliases[provider.uiName] ?? provider.uiName);
  return alphanumeric(partnerUrl).includes(expected);
}

/**
 * Lower-cased `param -> expected value` map for the operation. Empty for partners whose
 * URL contract is not pinned down, so callers assert only what is actually specified.
 */
export function getExpectedQueryParams(
  provider: BuySellProvider,
  buySell: BuySell,
): Record<string, string> {
  const config = providerUrlConfigs[provider.uiName];
  if (!config) return {};

  const paramMap = buySell.operation === OperationType.Buy ? config.buyParams : config.sellParams;
  return Object.fromEntries(
    Object.entries(paramMap).map(([key, resolve]) => [
      key.toLowerCase(),
      String(resolve(buySell)).toLowerCase(),
    ]),
  );
}
