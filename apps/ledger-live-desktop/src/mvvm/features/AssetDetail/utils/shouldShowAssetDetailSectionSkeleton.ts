export function shouldShowAssetDetailSectionSkeleton(
  isLoading: boolean,
  hasData: boolean,
): boolean {
  return isLoading && !hasData;
}
