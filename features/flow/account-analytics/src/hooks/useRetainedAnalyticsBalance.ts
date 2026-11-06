import { useState } from "react";
import type { AnalyticsBalanceData, AnalyticsResultState } from "../types";

export type RetainedAnalyticsBalance = Readonly<{
  data: AnalyticsBalanceData | undefined;
  isStale: boolean;
}>;

/** Keeps the last ready balance on screen while the next one loads, so the chart never blanks between selections. */
export function useRetainedAnalyticsBalance(
  balance: AnalyticsResultState<AnalyticsBalanceData>,
): RetainedAnalyticsBalance {
  const [retained, setRetained] = useState<AnalyticsBalanceData | undefined>(
    balance.status === "ready" ? balance.data : undefined,
  );
  const latest = balance.status === "ready" ? balance.data : undefined;
  const isLoading = balance.status === "loading";
  if (!isLoading && retained !== latest) setRetained(latest);

  if (isLoading) return { data: retained, isStale: retained !== undefined };
  return { data: latest, isStale: false };
}
