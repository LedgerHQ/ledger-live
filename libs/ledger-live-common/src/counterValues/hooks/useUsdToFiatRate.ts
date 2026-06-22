import { useMemo } from "react";
import { useGetUsdToFiatRateQuery } from "../state-manager/api";

const USD_FIAT_RATE_POLLING_MS = 60_000;

export type UsdToFiatRate = {
  status: "ready" | "loading" | "error";
  rate: number | null;
};

type UseUsdToFiatRateOptions = {
  skip?: boolean;
};

/**
 * Generic primitive that resolves a USD → user-fiat spot rate from the
 * countervalues API. Short-circuits to a rate of `1` for USD without firing
 * a network request. Subscribers share the same RTK cache key per `{ to }`,
 * so polling happens once regardless of how many components consume it.
 *
 * Returns flat primitives so consumers can depend on `status` and `rate`
 */
export function useUsdToFiatRate(
  targetTicker: string,
  options: UseUsdToFiatRateOptions = {},
): UsdToFiatRate {
  const to = targetTicker.toLowerCase();
  const skip = options.skip || to === "usd";
  const { data, isLoading, isError } = useGetUsdToFiatRateQuery(
    { to },
    { skip, pollingInterval: USD_FIAT_RATE_POLLING_MS },
  );

  return useMemo(() => {
    if (skip) return { status: "ready", rate: 1 };
    if (isLoading) return { status: "loading", rate: null };
    if (isError || data == null) return { status: "error", rate: null };
    return { status: "ready", rate: data };
  }, [skip, isLoading, isError, data]);
}
