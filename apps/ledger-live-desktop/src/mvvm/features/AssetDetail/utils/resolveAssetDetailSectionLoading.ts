/** Merges distribution loading with market loading for section skeleton display. */
export function resolveAssetDetailSectionLoading(
  isDistributionLoading: boolean,
  isMarketLoading: boolean,
  hasData: boolean,
): boolean {
  return (isDistributionLoading || isMarketLoading) && !hasData;
}
