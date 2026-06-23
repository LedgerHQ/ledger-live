import { useContext, useLayoutEffect } from "react";
import {
  DialogBackgroundContext,
  type DialogBackgroundTone,
} from "LLD/contexts/DialogBackgroundContext";

/**
 * Tints the enclosing dialog with the given status tone.
 *
 * - Call from any descendant of a dialog that provides `DialogBackgroundContext`.
 * - Pass `undefined` to opt out without unmounting (no gradient is drawn).
 * - The tone is registered before the next paint, so the gradient appears in
 *   the same frame as the requester.
 * - The request is automatically cleared on unmount or tone change.
 * - No-op outside a `DialogBackgroundContext` provider.
 */
export function useDialogBackgroundTone(tone: DialogBackgroundTone | undefined): void {
  const context = useContext(DialogBackgroundContext);

  useLayoutEffect(() => {
    if (!context || !tone) return;

    return context.requestBackgroundTone(tone);
  }, [context, tone]);
}
