import { useGetUsdToFiatRateQuery } from "../state-manager/api";

const USD_FIAT_RATE_POLLING_MS = 60_000;

export type UsdToFiatRate =
  | { status: "ready"; rate: number; ticker: string }
  | { status: "loading" }
  | { status: "error" };

/**
 * Generic primitive that resolves a USD → user-fiat spot rate from the
 * countervalues API. Short-circuits to a rate of `1` for USD without firing
 * a network request. Subscribers share the same RTK cache key per `{ to }`,
 * so polling happens once regardless of how many components consume it.
 */
export function useUsdToFiatRate(targetTicker: string): UsdToFiatRate {
  const to = targetTicker.toLowerCase();
  const skip = to === "usd";
  const { data, isLoading, isError } = useGetUsdToFiatRateQuery(
    { to },
    { skip, pollingInterval: USD_FIAT_RATE_POLLING_MS },
  );

  if (skip) return { status: "ready", rate: 1, ticker: "USD" };
  if (isLoading) return { status: "loading" };
  if (isError || data == null) return { status: "error" };
  return { status: "ready", rate: data, ticker: targetTicker.toUpperCase() };
}
