import { useEffect, useRef, type RefObject } from "react";
import { InteractionManager, type TextInput } from "react-native";
import { useRecipientInputFocus } from "../context/RecipientInputFocusContext";

/**
 * Hands the keyboard to the address input once the recipient step decided it is safe to.
 *
 * `autoFocus` grabs it on mount instead, while the enter transition still runs and while the
 * drawer the flow was opened from still retracts the keyboard as it dismisses. The focus is then
 * lost a few hundred milliseconds later and, since `autoFocus` only applies on mount, never
 * restored.
 */
export function useRecipientInputAutoFocus(isRecipientStep: boolean): RefObject<TextInput | null> {
  const inputRef = useRef<TextInput>(null);
  const { shouldFocusRecipientInput } = useRecipientInputFocus();

  useEffect(() => {
    if (!shouldFocusRecipientInput || !isRecipientStep) {
      return;
    }

    const task = InteractionManager.runAfterInteractions(() => inputRef.current?.focus());
    return () => task.cancel();
  }, [isRecipientStep, shouldFocusRecipientInput]);

  return inputRef;
}
