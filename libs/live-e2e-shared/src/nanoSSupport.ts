import { Currency } from "./enum/Currency";

/** Currencies with no Nano S coverage: every Desktop and Mobile E2E test using them skips on LNS. */
const LNS_UNSUPPORTED_CURRENCY_IDS = new Set([
  Currency.SUI.id,
  Currency.VET.id,
  Currency.HBAR.id,
  Currency.ALEO.id,
]);

export function isCurrencyUnsupportedOnLNS(currencyId: string): boolean {
  return LNS_UNSUPPORTED_CURRENCY_IDS.has(currencyId);
}
