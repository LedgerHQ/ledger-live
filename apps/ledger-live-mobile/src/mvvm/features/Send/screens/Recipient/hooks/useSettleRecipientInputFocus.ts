import { useEffect } from "react";
import { useRecipientInputFocus } from "../../../context/RecipientInputFocusContext";

/**
 * The step fills in from several async sources — the contacts feature flag, the contacts sync and
 * the clipboard read — so the decision is delayed until it stopped changing for a moment. That
 * quiet period also outlives the enter transition and the dismissal of the drawer the flow was
 * opened from, both of which retract the keyboard.
 */
const SETTLE_DELAY_MS = 400;

/**
 * Tells the send header whether the address input may take the keyboard. It only may when the
 * step settled on showing nothing at all: any content is something to read or tap first.
 */
export function useSettleRecipientInputFocus(hasContent: boolean): void {
  const { isRecipientInputFocusSettled, settleRecipientInputFocus } = useRecipientInputFocus();

  useEffect(() => {
    if (isRecipientInputFocusSettled) {
      return;
    }

    const timeout = setTimeout(() => settleRecipientInputFocus(!hasContent), SETTLE_DELAY_MS);
    return () => clearTimeout(timeout);
  }, [hasContent, isRecipientInputFocusSettled, settleRecipientInputFocus]);
}
