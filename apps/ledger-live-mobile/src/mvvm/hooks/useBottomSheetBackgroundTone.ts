import { useContext, useLayoutEffect } from "react";
import {
  BottomSheetBackgroundContext,
  type BottomSheetBackgroundTone,
} from "LLM/contexts/BottomSheetBackgroundContext";

/**
 * Tints the enclosing `QueuedDrawerBottomSheet` with the given status tone.
 *
 * - Call from any descendant of the sheet; the tone propagates via
 *   `BottomSheetBackgroundContext` and the sheet repaints its background.
 * - Pass `undefined` to opt out without unmounting (no gradient is drawn).
 * - The tone is registered before the next paint, so the gradient appears in
 *   the same frame as the requester (no one-frame gap when cycling tones).
 * - The request is automatically cleared on unmount or tone change.
 * - No-op outside a `BottomSheetBackgroundContext` provider.
 */
export function useBottomSheetBackgroundTone(tone: BottomSheetBackgroundTone | undefined): void {
  const context = useContext(BottomSheetBackgroundContext);

  useLayoutEffect(() => {
    if (!context || !tone) return;

    return context.requestBackgroundTone(tone);
  }, [context, tone]);
}
