import { useCallback, useMemo } from "react";
import { BigNumber } from "bignumber.js";
import { useCountervaluesState } from "@ledgerhq/live-countervalues-react";
import { useAssetGroupPnL } from "@ledgerhq/wallet-pnl/hooks";
import type { DistributionItem } from "@ledgerhq/types-live";
import { useSelector } from "LLD/hooks/redux";
import { counterValueCurrencySelector } from "~/renderer/reducers/settings";
import { track } from "~/renderer/analytics/segment";
import { usePnlViewModelBase } from "LLD/features/PnL/hooks/usePnlViewModelBase";
import type { PnlViewModel } from "LLD/features/PnL/types";
import { ASSET_DETAIL_TRACKING_PAGE_NAME } from "LLD/features/AssetDetail/constants";

const ZERO = new BigNumber(0);

type Props = {
  distributionItem: DistributionItem;
};

export function useAssetPnlViewModel({ distributionItem }: Props): PnlViewModel {
  const fiatCurrency = useSelector(counterValueCurrencySelector);
  const countervalues = useCountervaluesState();
  const currencyId = distributionItem.currency.id;

  const groupPnl = useAssetGroupPnL(distributionItem.accounts, countervalues, fiatCurrency);
  const { averageEntryPrice = ZERO } = groupPnl ?? {};

  const onAverageEntryPriceTooltipOpen = useCallback(
    (open: boolean) => {
      if (open) {
        track("button_clicked", {
          button: "market_stat_definition",
          currency: currencyId,
          type: "average_entry_price",
          page: ASSET_DETAIL_TRACKING_PAGE_NAME,
        });
      }
    },
    [currencyId],
  );

  const viewModel = usePnlViewModelBase({
    namespace: "pnl.asset",
    pnlData: groupPnl,
    secondaryCard: {
      id: "averageEntryPrice",
      titleKey: "pnl.asset.entry.title",
      tooltipKey: "pnl.asset.entry.tooltip",
      value: averageEntryPrice,
    },
    accountsCount: distributionItem.accounts.length,
  });

  const items = useMemo(
    () =>
      viewModel.items.map(item =>
        item.id === "averageEntryPrice" && item.type === "info"
          ? { ...item, onTooltipOpenChange: onAverageEntryPriceTooltipOpen }
          : item,
      ),
    [viewModel.items, onAverageEntryPriceTooltipOpen],
  );

  return { ...viewModel, items };
}
