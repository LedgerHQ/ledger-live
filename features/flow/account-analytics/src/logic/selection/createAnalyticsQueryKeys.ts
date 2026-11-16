import type { AnalyticsQueryContext } from "../../types";

export function createAnalyticsQueryKey(context: AnalyticsQueryContext): string {
  return JSON.stringify([
    context.assetId,
    context.accountId,
    context.fiatCurrencyId,
    context.period,
    context.metric,
    [...context.positionIds].sort((left, right) => left.localeCompare(right)),
  ]);
}

export function createAnalyticsPnlQueryKey(context: AnalyticsQueryContext): string {
  return JSON.stringify([
    context.assetId,
    context.accountId,
    context.fiatCurrencyId,
    [...context.positionIds].sort((left, right) => left.localeCompare(right)),
  ]);
}
