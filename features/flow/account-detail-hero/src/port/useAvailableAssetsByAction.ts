import { useMemo } from "react";
import {
  resolveAvailableAssetsByAction,
  type AssetsByAction,
} from "@features/platform-quick-actions";

type HeldAssetLike = Parameters<typeof resolveAvailableAssetsByAction>[0][number];

export type AssetActionSourceHooks = Readonly<{
  getRampIds: (kind: "onRamp" | "offRamp") => readonly string[] | null | undefined;
  swappableIds: readonly string[] | undefined;
  deactivatedIds: ReadonlySet<string>;
  isStakeable: (currencyId: string) => boolean;
}>;

export function useAvailableAssetsByAction<T extends HeldAssetLike>(
  assets: readonly T[],
  { getRampIds, swappableIds, deactivatedIds, isStakeable }: AssetActionSourceHooks,
): AssetsByAction<T> {
  return useMemo(
    () =>
      resolveAvailableAssetsByAction(assets, {
        buyableIds: getRampIds("onRamp") ?? [],
        sellableIds: getRampIds("offRamp") ?? [],
        swappableIds: swappableIds ?? [],
        deactivatedIds,
        isStakeable,
      }),
    [assets, deactivatedIds, getRampIds, isStakeable, swappableIds],
  );
}
