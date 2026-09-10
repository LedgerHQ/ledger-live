import { useMemo } from "react";
import { useCardAuthStatus } from "@features/flow-pay-card-auth";
import type { CardDisplayState, CardProps, CardViewProps } from "./Card.types";

/** Mock card balance shown until the real balance API is wired (see LIVE-35427 follow-up). */
const MOCK_CARD_BALANCE = 100;

export function useCardViewModel({
  title,
  login,
  formatCountervalue,
  formatTransactionAmount,
  balanceLabel,
  unlock,
}: CardProps): CardViewProps {
  const status = useCardAuthStatus();
  const displayState: CardDisplayState = status === "unknown" ? "resolving" : status;
  const isSignedIn = status === "signedIn";

  const cardVisual = useMemo<CardViewProps["cardVisual"]>(() => {
    if (!isSignedIn || !formatCountervalue || balanceLabel === undefined) return undefined;
    return { balance: MOCK_CARD_BALANCE, formatCountervalue, balanceLabel };
  }, [isSignedIn, formatCountervalue, balanceLabel]);

  return {
    title,
    login,
    displayState,
    cardVisual,
    formatTransactionAmount,
    unlock,
  };
}
