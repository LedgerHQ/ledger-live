import { Currency } from "./enum/Currency";

/** Currencies with no Nano S coverage: every Desktop and Mobile E2E test using them skips on LNS. */
const LNS_UNSUPPORTED_CURRENCY_IDS = new Set([
  Currency.SUI.id,
  Currency.VET.id,
  Currency.HBAR.id,
  Currency.ALEO.id,
]);

/**
 * Currencies whose Receive flow stops on the device-deprecation error screen on Nano S.
 * The rule is remote config (`config_nanoapp_<app>.deviceDeprecated`, flow "receive"), so keep
 * this list in sync with Firebase: Receive tests skip LNS and an LNS test expects that screen.
 */
const LNS_RECEIVE_BLOCKED_CURRENCY_IDS = new Set([Currency.ZEC.id]);

export function isCurrencyUnsupportedOnLNS(currencyId: string): boolean {
  return LNS_UNSUPPORTED_CURRENCY_IDS.has(currencyId);
}

export function isReceiveBlockedOnLNS(currencyId: string): boolean {
  return LNS_RECEIVE_BLOCKED_CURRENCY_IDS.has(currencyId);
}
