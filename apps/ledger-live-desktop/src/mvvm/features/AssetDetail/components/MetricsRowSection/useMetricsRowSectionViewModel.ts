import type { DistributionItem } from "@ledgerhq/types-live";
import { useStake } from "LLD/hooks/useStake";
import { useShouldDisplayAssetPnl } from "../PnL/useShouldDisplayAssetPnl";

type Props = Readonly<{
  distributionItem: DistributionItem;
}>;

export function useMetricsRowSectionViewModel({ distributionItem }: Props) {
  const pnlVisible = useShouldDisplayAssetPnl(distributionItem);
  const { getCanStakeCurrency } = useStake();
  const stakingVisible = getCanStakeCurrency(distributionItem.currency.id);

  return {
    shouldRenderSection: pnlVisible || stakingVisible,
  };
}
