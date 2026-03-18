import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import { Page, useMarketActions } from "LLD/features/Market/hooks/useMarketActions";
import { useGetStakeLabelLocaleBased } from "~/renderer/hooks/useGetStakeLabelLocaleBased";
import { MarketCurrencyData, KeysPriceChange } from "@ledgerhq/live-common/market/utils/types";
import { MarketAction } from "./types";

type UseRowItemViewModelProps = {
  currency?: MarketCurrencyData | null;
  toggleStar: () => void;
  range?: string;
};

export function useRowItemViewModel({ currency, toggleStar, range }: UseRowItemViewModelProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const {
    onBuy,
    onStake,
    onSwap,
    onSell,
    availableOnBuy,
    availableOnSwap,
    availableOnStake,
    availableOnSell,
  } = useMarketActions({ currency, page: Page.Market });

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

  const hasLedgerIds = Boolean(currency?.ledgerIds && currency.ledgerIds.length > 0);

  const actions: MarketAction[] = useMemo(() => {
    if (!hasLedgerIds) return [];
    const items: MarketAction[] = [];
    if (availableOnBuy)
      items.push({ type: "buy", label: t("accounts.contextMenu.buy"), onClick: onBuy });
    if (availableOnSell)
      items.push({ type: "sell", label: t("accounts.contextMenu.sell"), onClick: onSell });
    if (availableOnSwap)
      items.push({ type: "swap", label: t("accounts.contextMenu.swap"), onClick: onSwap });
    if (availableOnStake)
      items.push({ type: "stake", label: earnStakeLabelCoin, onClick: onStake });
    return items;
  }, [
    hasLedgerIds,
    availableOnBuy,
    availableOnSwap,
    availableOnStake,
    availableOnSell,
    onBuy,
    onSwap,
    onStake,
    onSell,
    earnStakeLabelCoin,
    t,
  ]);

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const currentPriceChangePercentage = currency?.priceChangePercentage[range as KeysPriceChange];

  return {
    onCurrencyClick,
    onStarClick,
    actions,
    hasActions: actions.length > 0,
    currentPriceChangePercentage,
  };
}
