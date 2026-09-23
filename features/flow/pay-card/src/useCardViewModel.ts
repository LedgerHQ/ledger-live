import { useMemo } from "react";
import { useCardAuthStatus } from "@features/flow-pay-card-auth";
import { useTranslation } from "@shared/i18n";
import { useCardWalletsTotal } from "@features/flow-pay-card-assets";
import type { CardDisplayState, CardProps, CardViewProps } from "./Card.types";
import { useCardLifecycleTracking } from "./useCardLifecycleTracking";

export function useCardViewModel({
  login,
  assets,
  formatters,
  onShowMore,
  onTopUp,
  onChooseCardType,
  cardSettingsActions,
}: CardProps): CardViewProps {
  const { t } = useTranslation();
  useCardLifecycleTracking();
  const status = useCardAuthStatus();
  const displayState: CardDisplayState = status === "unknown" ? "resolving" : status;
  const isSignedIn = status === "signedIn";
  const formatCountervalue = formatters?.countervalue;
  const balanceLabel = t("payTab.card.balanceLabel");
  const { total, isLoading, isError } = useCardWalletsTotal(assets, isSignedIn);

  const cardVisual = useMemo<CardViewProps["cardVisual"]>(() => {
    if (!isSignedIn || !formatCountervalue || assets === undefined || isError) return undefined;

    return { balance: total, formatCountervalue, balanceLabel, isLoading };
  }, [isSignedIn, formatCountervalue, balanceLabel, assets, total, isLoading, isError]);

  return {
    title: t("payTab.card.title"),
    disclaimer: t("payTab.disclaimer"),
    login,
    displayState,
    cardVisual,
    assets,
    formatters,
    onShowMore,
    onTopUp,
    onChooseCardType,
    cardSettingsActions,
  };
}
