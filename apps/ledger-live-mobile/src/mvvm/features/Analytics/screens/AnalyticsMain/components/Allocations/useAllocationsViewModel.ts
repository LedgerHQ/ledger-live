import { useCallback, useMemo } from "react";
import { getCurrencyColor, ColorableCurrency } from "@ledgerhq/live-common/currencies/index";
import { useTranslation } from "~/context/Locale";
import { useTheme } from "styled-components/native";
import { useTheme as useLumenTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { useSelector } from "~/context/hooks";
import chunk from "lodash/chunk";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { ensureContrast } from "~/colors";
import { useDistribution } from "~/actions/general";
import { track } from "~/analytics";
import { blacklistedTokenIdsSelector } from "~/reducers/settings";
import type { ColorableDistributionItem } from "LLM/features/Analytics/components/RingChart/types";

const NUMBER_MAX_ALLOCATION_ASSETS_TO_DISPLAY = 4;

export function useAllocationsViewModel(screenName: string, onPress: () => void) {
  const { t } = useTranslation();
  const { shouldDisplayAggregatedAssets } = useWalletFeaturesConfig("mobile");
  const distribution = useDistribution({
    showEmptyAccounts: true,
    hideEmptyTokenAccount: true,
    groupBy: shouldDisplayAggregatedAssets ? "asset" : undefined,
  });
  const { colors } = useTheme();
  const { theme } = useLumenTheme();
  const canvasColor = theme.colors.bg.canvas;
  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);

  const getCurrencyColorEnsureContrast = useCallback(
    (currency: ColorableCurrency) => ensureContrast(getCurrencyColor(currency), canvasColor),
    [canvasColor],
  );

  const goToAnalyticsAllocations = useCallback(() => {
    track("analytics_clicked", {
      analytics: "Allocations",
      page: screenName,
    });
    onPress();
  }, [onPress, screenName]);

  const distributionListFormatted = useMemo((): ColorableDistributionItem[] => {
    const displayedCurrencies: ColorableDistributionItem[] = distribution.list
      .filter(asset => {
        return (
          asset.currency.type !== "TokenCurrency" ||
          !blacklistedTokenIds.includes(asset.currency.id)
        );
      })
      .map(obj => {
        const { accounts: _accounts, ...other } = obj;
        return other;
      });

    if (
      displayedCurrencies.length === distribution.list.length &&
      displayedCurrencies.length <= NUMBER_MAX_ALLOCATION_ASSETS_TO_DISPLAY
    ) {
      return distribution.list;
    }

    const data: ColorableDistributionItem[] = displayedCurrencies.slice(
      0,
      NUMBER_MAX_ALLOCATION_ASSETS_TO_DISPLAY - 1,
    );

    let othersDistribution = 0;
    let othersAmount = 0;
    for (const assetAllocation of distribution.list.slice(
      NUMBER_MAX_ALLOCATION_ASSETS_TO_DISPLAY - 1,
    )) {
      othersDistribution += assetAllocation.distribution;
      othersAmount += assetAllocation.amount;
    }

    const othersAllocations: ColorableDistributionItem = {
      currency: {
        type: "CryptoCurrency",
        id: "others",
        ticker: t("common.others"),
        color: colors.neutral.c70,
      },
      distribution: othersDistribution,
      amount: othersAmount,
    };

    data.push(othersAllocations);

    return data;
  }, [distribution.list, colors.neutral.c70, t, blacklistedTokenIds]);

  const allocationColumns = useMemo(
    () => chunk(distributionListFormatted.slice(0, 4), 2),
    [distributionListFormatted],
  );

  return {
    distributionListFormatted,
    allocationColumns,
    getCurrencyColorEnsureContrast,
    goToAnalyticsAllocations,
  };
}
