import { useMemo } from "react";
import { useCardAuthStatus, useCardSessionResolving } from "@features/flow-pay-card-auth";
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
  onViewRewards,
  cardSettingsActions,
}: CardProps): CardViewProps {
  const { t } = useTranslation();
  useCardLifecycleTracking();
  const status = useCardAuthStatus();
  const isSessionResolving = useCardSessionResolving();
  const isSignedIn = status === "signedIn";
  const displayState: CardDisplayState = resolveDisplayState(status, isSessionResolving);
  const formatCountervalue = formatters?.countervalue;
  const balanceLabel = t("payTab.card.balanceLabel");
  const { total, isLoading, isError } = useCardWalletsTotal(assets, isSignedIn);

  const cardVisual = useMemo<CardViewProps["cardVisual"]>(() => {
    if (!formatCountervalue) return undefined;

    if (displayState === "resolving") {
      return { balance: 0, formatCountervalue, balanceLabel, isLoading: true };
    }

    if (!isSignedIn || assets === undefined || isError) return undefined;

    return { balance: total, formatCountervalue, balanceLabel, isLoading };
  }, [
    displayState,
    isSignedIn,
    formatCountervalue,
    balanceLabel,
    assets,
    total,
    isLoading,
    isError,
  ]);

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
    onViewRewards,
    cardSettingsActions,
  };
}

function resolveDisplayState(
  status: ReturnType<typeof useCardAuthStatus>,
  isSessionResolving: boolean,
): CardDisplayState {
  if (status === "signedIn") return "signedIn";
  if (status === "unknown" || isSessionResolving) return "resolving";

  return "signedOut";
}
