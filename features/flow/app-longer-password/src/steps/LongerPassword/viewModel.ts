import { useCallback, useEffect, useState } from "react";
import type {
  LongerPasswordStep,
  LongerPasswordViewModel,
  UseLongerPasswordViewModelOptions,
} from "./types";

// For a dismissal the sheet never reports. Longer than the 600ms the queued sheet gives its own,
// which retracts the keyboard as it lands: a field mounted inside that window raises a keyboard the
// sheet then takes away.
const PROMPT_HIDE_FALLBACK_MS = 800;

export function useLongerPasswordViewModel({
  savePassword,
}: UseLongerPasswordViewModelOptions): LongerPasswordViewModel {
  const [step, setStep] = useState<LongerPasswordStep>("prompt");
  const [hasSaveFailed, setHasSaveFailed] = useState(false);

  const onChangeRequested = useCallback(() => setStep("closing"), []);

  const onPromptHidden = useCallback(
    () => setStep(current => (current === "closing" ? "enter" : current)),
    [],
  );

  useEffect(() => {
    if (step !== "closing") {
      return;
    }

    const timer = setTimeout(onPromptHidden, PROMPT_HIDE_FALLBACK_MS);

    return () => clearTimeout(timer);
  }, [onPromptHidden, step]);

  const onEntered = useCallback(() => setStep("confirm"), []);

  const onConfirmed = useCallback(
    async (password: string) => {
      setHasSaveFailed(false);

      try {
        await savePassword(password);
      } catch {
        setHasSaveFailed(true);
        return;
      }

      setStep("done");
    },
    [savePassword],
  );

  // Back to the start is how the host knows the flow no longer holds the screen.
  const onDone = useCallback(() => setStep("prompt"), []);

  return {
    step,
    hasSaveFailed,
    onChangeRequested,
    onPromptHidden,
    onEntered,
    onConfirmed,
    onDone,
  };
}
