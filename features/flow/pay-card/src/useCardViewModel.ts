import { useMemo } from "react";
import { useCardAuthStatus } from "@features/flow-pay-card-auth";
import { useTranslation } from "@shared/i18n";
import { useCardWalletsTotal } from "@features/flow-pay-card-assets";
import type { CardDisplayState, CardProps, CardViewProps } from "./Card.types";

export function useCardViewModel({
  login,
  assets,
  formatters,
  onShowMore,
  onTopUp,
}: CardProps): CardViewProps {
  const { t } = useTranslation();
  const status = useCardAuthStatus();
  const displayState: CardDisplayState = status === "unknown" ? "resolving" : status;
  const isSignedIn = status === "signedIn";
  const formatCountervalue = formatters?.countervalue;
  const balanceLabel = t("payTab.card.balanceLabel");
  // The card's balance is what its funding wallets are worth; the provider reports no total.
  const { total, isLoading, isError } = useCardWalletsTotal(assets, isSignedIn);

  const cardVisual = useMemo<CardViewProps["cardVisual"]>(() => {
    if (!isSignedIn || !formatCountervalue) return undefined;
    // No wallets to sum, or a read that failed: the bare artwork rather than a zero that reads as
    // a real balance. The Assets list is what says the read failed.
    if (assets === undefined || isError) return undefined;

    // No wallets to sum, or a read that failed: the bare artwork rather than a zero that reads as
    // a real balance. The Assets list is what says the read failed.

    return { balance: total, formatCountervalue, balanceLabel, isLoading };
  }, [isSignedIn, formatCountervalue, balanceLabel, assets, total, isLoading, isError]);

  return {
    title: t("payTab.card.title"),
    login,
    displayState,
    cardVisual,
    assets,
    formatters,
    onShowMore,
    onTopUp,
  };
}
