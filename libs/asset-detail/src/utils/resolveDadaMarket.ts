import type { AssetsDataWithPagination } from "@ledgerhq/live-common/dada-client/state-manager/types";

type DadaMarket = AssetsDataWithPagination["markets"][string];

function findMarket(
  data: AssetsDataWithPagination | undefined,
  ledgerIds: readonly string[],
): DadaMarket | undefined {
  if (!data) return undefined;
  for (const id of ledgerIds) {
    const market = data.markets[id];
    if (market) return market;
  }
  return undefined;
}

export function resolveDadaMarket(
  ledgerIds: readonly string[] | undefined,
  bulkData: AssetsDataWithPagination | undefined,
  assetData: AssetsDataWithPagination | undefined,
): DadaMarket | undefined {
  if (!ledgerIds?.length) return undefined;
  return findMarket(bulkData, ledgerIds) ?? findMarket(assetData, ledgerIds);
}
