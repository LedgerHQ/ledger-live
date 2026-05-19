import type { DistributionItem } from "@ledgerhq/types-live";

type ResolveMarketPriceSectionSourceIdParams = Readonly<{
  marketId?: string;
  distributionItem?: DistributionItem;
  ledgerId?: string;
}>;

export function resolveMarketPriceSectionSourceId({
  marketId,
  distributionItem,
  ledgerId,
}: ResolveMarketPriceSectionSourceIdParams): string | undefined {
  return marketId ?? distributionItem?.marketId ?? distributionItem?.currency.id ?? ledgerId;
}
