import { useMemo } from "react";
import { useCardAuthStatus } from "@features/flow-pay-card-auth";
import { useTranslation } from "@shared/i18n";
import { useCardPricedWallets } from "./CardAssets/useCardPricedWallets";
import type { CardDisplayState, CardProps, CardViewProps } from "./Card.types";

export function useCardViewModel({
  login,
  assets,
  formatters,
  unlock,
  onShowMore,
}: CardProps): CardViewProps {
  const { t } = useTranslation();
  const status = useCardAuthStatus();
  const displayState: CardDisplayState = status === "unknown" ? "resolving" : status;
  const isSignedIn = status === "signedIn";
  const formatCountervalue = formatters?.countervalue;
  const balanceLabel = t("payTab.card.balanceLabel");
  // The card's balance is what its funding wallets are worth; the provider reports no total.
  const { total, isLoading } = useCardPricedWallets(assets, isSignedIn);

  const cardVisual = useMemo<CardViewProps["cardVisual"]>(() => {
    if (!isSignedIn || !formatCountervalue) return undefined;
    return { balance: total, formatCountervalue, balanceLabel, isLoading };
  }, [isSignedIn, formatCountervalue, balanceLabel, total, isLoading]);

  return {
    title: t("payTab.card.title"),
    login,
    displayState,
    cardVisual,
    assets,
    formatters,
    unlock,
    onShowMore,
  };
}
