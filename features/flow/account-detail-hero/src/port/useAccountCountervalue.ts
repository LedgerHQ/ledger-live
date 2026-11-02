import { useMemo } from "react";
import {
  resolveAccountCountervalue,
  type CalculateCountervalue,
} from "../logic/resolveAccountCountervalue";

type Assets<TCurrency, TBalance extends Readonly<{ isZero: () => boolean }>> = Parameters<
  typeof resolveAccountCountervalue<TCurrency, TBalance>
>[0];

export function useAccountCountervalue<
  TCurrency,
  TBalance extends Readonly<{ isZero: () => boolean }>,
>(
  assets: Assets<TCurrency, TBalance>,
  calculateCountervalue: CalculateCountervalue<TCurrency, TBalance>,
): number | undefined {
  return useMemo(
    () => resolveAccountCountervalue(assets, calculateCountervalue),
    [assets, calculateCountervalue],
  );
}
