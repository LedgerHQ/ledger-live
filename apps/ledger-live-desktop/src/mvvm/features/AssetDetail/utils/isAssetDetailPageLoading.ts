export function isAssetDetailPageLoading(
  isDistributionLoading: boolean,
  isMarketLoading: boolean,
  hasMarketData: boolean,
): boolean {
  return isDistributionLoading || (isMarketLoading && !hasMarketData);
}
