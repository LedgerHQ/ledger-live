import { AssetsAdditionalData, type GetAssetsDataParams } from "./types";

export function buildAssetsQueryParams(
  queryArg: GetAssetsDataParams,
  opts?: { pageSize?: number; cursor?: string },
): Record<string, unknown> {
  return {
    pageSize: opts?.pageSize ?? 100,
    ...(opts?.cursor && { cursor: opts.cursor }),
    ...(queryArg.useCase && { transaction: queryArg.useCase }),
    ...(queryArg.currencyIds &&
      queryArg.currencyIds.length > 0 && {
        currencyIds: queryArg.currencyIds,
      }),
    ...(queryArg.networkIds &&
      queryArg.networkIds.length > 0 && {
        networkIds: queryArg.networkIds.join(","),
      }),
    ...(queryArg.categories &&
      queryArg.categories.length > 0 && {
        categories: queryArg.categories.join(","),
      }),
    ...(queryArg.search && { search: queryArg.search }),
    product: queryArg.product,
    minVersion: queryArg.version,
    ...(queryArg.includeTestNetworks && { includeTestNetworks: queryArg.includeTestNetworks }),
    additionalData: queryArg.additionalData || [
      AssetsAdditionalData.Apy,
      AssetsAdditionalData.MarketTrend,
    ],
  };
}
