import BigNumber from "bignumber.js";

import type { RawQuote } from "../service/types";
import {
  QuoteWarningCodes,
  type QuoteWarning,
  type QuotesAppPlatform,
  type QuotesVersionCompatibility,
} from "../types";
import { computeUnrealisticQuote } from "./unrealisticQuote";

export type NormalizationContext = {
  sendCurrencyId: string;
  receiveCurrencyId: string;
  sendParentCurrencyId?: string;
  receiveParentCurrencyId?: string;
  deviceModelId?: string;
  appVersion?: {
    platform: QuotesAppPlatform;
    version: string | null;
  };
  versionCompatibility?: QuotesVersionCompatibility[];
  highValueLossThreshold?: number;
  spotPrices: Record<string, number>;
};

const NANO_S_MODEL_ID = "nanoS";

const NANO_S_INCOMPATIBLE_PROVIDERS = new Set([
  "thorswap",
  "uniswap",
  "lifi",
  "oneinch",
  "oneinchfusion",
  "velora",
  "okx",
]);

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

function compareVersions(v1: string, v2: string): number {
  const v1parts = v1.split(".").map(Number);
  const v2parts = v2.split(".").map(Number);
  for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
    const num1 = v1parts[i] || 0;
    const num2 = v2parts[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

function matchesCompatibilityCurrency(
  currencyId: string,
  compatibility: QuotesVersionCompatibility,
): boolean {
  switch (compatibility.token) {
    case "none":
      return currencyId === compatibility.id;
    case "only":
      return currencyId.startsWith(`${compatibility.id}/`);
    case "all":
      return currencyId === compatibility.id || currencyId.startsWith(`${compatibility.id}/`);
  }
}

function addLedgerLiveVersionWarning(
  warnings: QuoteWarning[],
  context: NormalizationContext,
): void {
  const appVersion = context.appVersion;
  if (!appVersion?.version || !context.versionCompatibility) {
    return;
  }

  const currencyIds = [context.sendCurrencyId, context.receiveCurrencyId];
  for (const compatibility of context.versionCompatibility) {
    const requiredVersion = appVersion.platform === "lld" ? compatibility.lld : compatibility.llm;
    if (!requiredVersion || compareVersions(appVersion.version, requiredVersion) >= 0) {
      continue;
    }

    const currencyId = currencyIds.find(id => matchesCompatibilityCurrency(id, compatibility));
    if (currencyId) {
      warnings.push({
        code: QuoteWarningCodes.LEDGER_LIVE_VERSION_INCOMPATIBILITY,
        currencyId,
        platform: appVersion.platform,
        currentVersion: appVersion.version,
        requiredVersion,
      });
      return;
    }
  }
}

function addHighValueLossWarning(
  warnings: QuoteWarning[],
  quote: RawQuote,
  context: NormalizationContext,
): void {
  if (context.highValueLossThreshold == null) {
    return;
  }
  if (!Number.isFinite(context.highValueLossThreshold)) {
    return;
  }

  const fromSpotPrice = context.spotPrices[context.sendCurrencyId];
  const toSpotPrice = context.spotPrices[context.receiveCurrencyId];
  if (!fromSpotPrice || !toSpotPrice || quote.amountFrom == null) {
    return;
  }

  const amountFromCounterValue = new BigNumber(quote.amountFrom).multipliedBy(fromSpotPrice);
  const amountToCounterValue = new BigNumber(quote.amountTo).multipliedBy(toSpotPrice);

  if (amountFromCounterValue.isZero() || amountFromCounterValue.isNaN()) {
    return;
  }

  const lossPercent = new BigNumber(1)
    .minus(amountToCounterValue.dividedBy(amountFromCounterValue))
    .multipliedBy(100);

  if (!lossPercent.isGreaterThan(0)) {
    return;
  }

  const hasHighValueLoss = amountToCounterValue.isLessThanOrEqualTo(
    amountFromCounterValue.multipliedBy(context.highValueLossThreshold),
  );

  if (hasHighValueLoss) {
    const lossPercentNumber = lossPercent.toNumber();
    if (!Number.isFinite(lossPercentNumber)) {
      return;
    }

    warnings.push({
      code: QuoteWarningCodes.HIGH_VALUE_LOSS,
      lossPercent: lossPercentNumber,
    });
  }
}

function addNanoSIncompatibilityWarnings(
  warnings: QuoteWarning[],
  quote: RawQuote,
  context: NormalizationContext,
): void {
  if (context.deviceModelId !== NANO_S_MODEL_ID) {
    return;
  }

  if (NANO_S_INCOMPATIBLE_PROVIDERS.has(quote.provider)) {
    warnings.push({
      code: QuoteWarningCodes.NANO_S_PROVIDER_INCOMPATIBILITY,
      provider: quote.provider,
    });
  }

  const incompatibleCurrencyIds = new Set<string>();
  for (const currencyId of [context.sendCurrencyId, context.receiveCurrencyId]) {
    if (NANO_S_INCOMPATIBLE_CURRENCIES.has(currencyId)) {
      incompatibleCurrencyIds.add(currencyId);
    }
  }

  for (const currencyId of [context.sendParentCurrencyId, context.receiveParentCurrencyId]) {
    if (
      currencyId &&
      (NANO_S_INCOMPATIBLE_CURRENCIES.has(currencyId) ||
        NANO_S_INCOMPATIBLE_TOKEN_PARENT_CURRENCIES.has(currencyId))
    ) {
      incompatibleCurrencyIds.add(currencyId);
    }
  }

  for (const currencyId of incompatibleCurrencyIds) {
    warnings.push({
      code: QuoteWarningCodes.NANO_S_CURRENCY_INCOMPATIBILITY,
      currencyId,
    });
  }
}

export function buildQuoteWarnings(quote: RawQuote, context: NormalizationContext): QuoteWarning[] {
  const warnings: QuoteWarning[] = [];

  addLedgerLiveVersionWarning(warnings, context);
  addNanoSIncompatibilityWarnings(warnings, quote, context);
  addHighValueLossWarning(warnings, quote, context);

  if (context.spotPrices[context.receiveCurrencyId] === 0) {
    warnings.push({ code: QuoteWarningCodes.UNKNOWN_RECEIVE_FIAT_PRICE });
  }

  const unrealisticQuote = computeUnrealisticQuote(quote, context);
  if (unrealisticQuote) {
    warnings.push(unrealisticQuote);
  }

  return warnings;
}
