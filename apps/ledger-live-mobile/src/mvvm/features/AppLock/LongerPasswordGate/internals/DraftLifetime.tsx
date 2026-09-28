import { usePasswordDraft, type LongerPasswordStep } from "@features/flow-app-lock";
import { useEffect } from "react";

// Drops the stored password from the draft, which the provider would otherwise keep: it outlives
// the overlay so a lock mid-flow cannot strand the confirmation.
export function DraftLifetime({ step }: Readonly<{ step: LongerPasswordStep }>): null {
  const draft = usePasswordDraft();

  useEffect(() => {
    if (step === "done") {
      draft.clear();
    }
  }, [draft, step]);

  return null;
}
