import type { DistributionItem } from "@ledgerhq/types-live";
import { isRobinhoodExclusiveAsset } from "@ledgerhq/asset-detail";
import { useFeature } from "@features/platform-feature-flags";
import { useReceiveNetworkLedgerIds } from "../../hooks/useReceiveNetworkLedgerIds";

type Params = Readonly<{
  distributionItem?: DistributionItem;
}>;

export function useRobinhoodDisclaimerBannerViewModel({ distributionItem }: Params) {
  const robinhoodDisclaimer = useFeature("llRobinhoodDisclaimer");

  const networkLedgerIds = useReceiveNetworkLedgerIds({
    metaCurrencyId: distributionItem?.metaCurrencyId,
    marketApiId: distributionItem?.marketId,
    ticker: distributionItem?.currency.ticker,
    currencyId: distributionItem?.currency.id,
    fallbackLedgerIds: [],
  });

  const hasPositiveBalance = (distributionItem?.amount ?? 0) > 0;
  const show =
    !!robinhoodDisclaimer?.enabled &&
    hasPositiveBalance &&
    isRobinhoodExclusiveAsset(networkLedgerIds);

  return { show };
}
