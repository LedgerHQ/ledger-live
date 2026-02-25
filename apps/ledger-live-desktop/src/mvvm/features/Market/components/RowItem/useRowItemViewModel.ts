import { useCallback } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import { Page, useMarketActions } from "LLD/features/Market/hooks/useMarketActions";
import { useGetStakeLabelLocaleBased } from "~/renderer/hooks/useGetStakeLabelLocaleBased";
import { MarketCurrencyData, KeysPriceChange } from "@ledgerhq/live-common/market/utils/types";

type UseRowItemViewModelProps = {
  currency?: MarketCurrencyData | null;
  toggleStar: () => void;
  range?: string;
};

export function useRowItemViewModel({ currency, toggleStar, range }: UseRowItemViewModelProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { onBuy, onStake, onSwap, availableOnBuy, availableOnSwap, availableOnStake } =
    useMarketActions({ currency, page: Page.Market });

  const earnStakeLabelCoin = useGetStakeLabelLocaleBased();

  const onCurrencyClick = useCallback(() => {
    if (currency) {
      setTrackingSource("Page Market");
      navigate(`/market/${currency.id}`, {
        state: currency,
      });
    }
  }, [currency, navigate]);

  const onStarClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      toggleStar();
    },
    [toggleStar],
  );

  const hasActions =
    currency?.ledgerIds &&
    currency?.ledgerIds.length > 0 &&
    (availableOnBuy || availableOnSwap || availableOnStake);

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const currentPriceChangePercentage = currency?.priceChangePercentage[range as KeysPriceChange];

  return {
    onCurrencyClick,
    onStarClick,
    onBuy,
    onStake,
    onSwap,
    availableOnBuy,
    availableOnSwap,
    availableOnStake,
    hasActions: Boolean(hasActions),
    currentPriceChangePercentage,
    earnStakeLabelCoin,
    buyLabel: t("accounts.contextMenu.buy"),
    swapLabel: t("accounts.contextMenu.swap"),
  };
}
