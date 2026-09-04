import { useMemo } from "react";
import type { CardProps, CardViewProps } from "./Card.types";

/** The balance API is not wired yet, and the card renders the same at zero as at any amount. */
const PLACEHOLDER_CARD_BALANCE = 0;

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
  formatCountervalue,
  balanceLabel,
}: CardProps): CardViewProps {
  const cardVisual = useMemo<CardViewProps["cardVisual"]>(() => {
    if (!formatCountervalue || balanceLabel === undefined) return undefined;
    return { balance: PLACEHOLDER_CARD_BALANCE, formatCountervalue, balanceLabel };
  }, [formatCountervalue, balanceLabel]);

  return { title, oauthConfig, callback, cardVisual };
}
