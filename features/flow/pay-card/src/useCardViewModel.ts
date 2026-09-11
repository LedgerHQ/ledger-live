import { useMemo } from "react";
import { useCardAuthStatus } from "@features/flow-pay-card-auth";
import type { CardDisplayState, CardProps, CardViewProps } from "./Card.types";

/** Mock card balance shown until the real balance API is wired (see LIVE-35427 follow-up). */
const MOCK_CARD_BALANCE = 100;

/**
 * View model for the Pay Card flow. The flow owns the (currently mocked) balance, so hosts no longer
 * assemble the card visual themselves; they only hand over the two things the flow cannot know — the
 * countervalue formatter (locale + counter-value currency) and the localized label. Without both, the
 * card falls back to the bare artwork.
 */
export function useCardViewModel({
  title,
  oauthConfig,
  callback,
  openHostedLogin,
  openHostedPage,
  formatCountervalue,
  balanceLabel,
  onTrackEvent,
}: CardProps): CardViewProps {
  const status = useCardAuthStatus();
  const displayState: CardDisplayState = status === "unknown" ? "resolving" : status;
  const isSignedIn = status === "signedIn";

  const cardVisual = useMemo<CardViewProps["cardVisual"]>(() => {
    // The balance overlay belongs to a signed-in card only. Building it while signed out would drop
    // the mock balance onto the bare artwork the login CTA sits above.
    if (!isSignedIn || !formatCountervalue || balanceLabel === undefined) return undefined;
    return { balance: MOCK_CARD_BALANCE, formatCountervalue, balanceLabel };
  }, [isSignedIn, formatCountervalue, balanceLabel]);

  return {
    title,
    oauthConfig,
    callback,
    openHostedLogin,
    openHostedPage,
    onTrackEvent,
    displayState,
    cardVisual,
  };
}
