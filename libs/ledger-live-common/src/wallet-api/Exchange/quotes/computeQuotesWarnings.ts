import { QuotesWarningCodes, type QuotesWarning } from "./types";

export type ComputeQuotesWarningsArgs = {
  deviceModelId?: string;
  sendCurrencyId: string;
  receiveCurrencyId: string;
  sendParentCurrencyId?: string;
  receiveParentCurrencyId?: string;
};

const NANO_S_MODEL_ID = "nanoS";

const NANO_S_INCOMPATIBLE_CURRENCIES = new Set([
  "ton",
  "cardano",
  "cosmos",
  "near",
  "aptos",
  "hedera",
  "monad",
  "etherlink",
  "osmo",
  "sui",
  "dydx",
  "kaspa",
  "assethub_polkadot",
  "zcash",
  "hyperevm",
]);

const NANO_S_INCOMPATIBLE_TOKEN_PARENT_CURRENCIES = new Set(["solana", "sui"]);

export function computeQuotesWarnings(args: ComputeQuotesWarningsArgs): QuotesWarning[] {
  if (args.deviceModelId !== NANO_S_MODEL_ID) {
    return [];
  }

  const incompatibleCurrencyIds = new Set<string>();
  for (const currencyId of [args.sendCurrencyId, args.receiveCurrencyId]) {
    if (NANO_S_INCOMPATIBLE_CURRENCIES.has(currencyId)) {
      incompatibleCurrencyIds.add(currencyId);
    }
  }

  for (const currencyId of [args.sendParentCurrencyId, args.receiveParentCurrencyId]) {
    if (
      currencyId &&
      (NANO_S_INCOMPATIBLE_CURRENCIES.has(currencyId) ||
        NANO_S_INCOMPATIBLE_TOKEN_PARENT_CURRENCIES.has(currencyId))
    ) {
      incompatibleCurrencyIds.add(currencyId);
    }
  }

  return Array.from(incompatibleCurrencyIds).map(currencyId => ({
    code: QuotesWarningCodes.NANO_S_CURRENCY_INCOMPATIBILITY,
    currencyId,
  }));
}
