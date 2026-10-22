import { useCallback, useEffect, useState } from "react";
import type { ConfigValueState } from "../../types";
import { formatValue } from "./formatValue";
import type { AppConfigViewModel } from "./types";

/** Whether a value takes a dev value: only a string can be typed. */
export const isTypeable = ({ baseValue }: ConfigValueState) => typeof baseValue === "string";

/**
 * The text field of a value on Dev. It starts from the dev value the host refused, or from what the
 * next session runs on, and follows them when they change. `commit` saves the draft as the dev value,
 * or removes the dev value when the draft is empty or the base value. It does nothing when the draft
 * is what the next session already runs on, then shows what the host kept, and returns false when
 * the host refused the draft. An unsaved or refused draft is registered, so a reload or a selection
 * change commits it first, and a refused one keeps the app from reloading until it is fixed.
 */
export function useDevValueField(
  value: ConfigValueState,
  {
    setDevValue,
    removeDevValue,
    registerDraft,
  }: Pick<AppConfigViewModel, "setDevValue" | "removeDevValue" | "registerDraft">,
) {
  const shown = value.rejectedDevValue?.value ?? formatValue(value.nextValue);
  const [draft, setDraft] = useState(shown);
  const [syncedWith, setSyncedWith] = useState(shown);
  if (shown !== syncedWith) {
    setSyncedWith(shown);
    setDraft(shown);
  }

  const commit = useCallback(() => {
    setDraft(shown);
    const isRejected = value.rejectedDevValue !== undefined;
    if (draft === "" || draft === value.baseValue) {
      if (value.hasDevValue || isRejected) removeDevValue(value.name);
      return true;
    }
    return draft !== value.nextValue || isRejected ? setDevValue(value.name, draft) : true;
  }, [draft, shown, value, setDevValue, removeDevValue]);

  const isUnsaved = draft !== shown || value.rejectedDevValue !== undefined;
  useEffect(
    () => (isUnsaved ? registerDraft(commit) : undefined),
    [isUnsaved, commit, registerDraft],
  );

  return { draft, setDraft, error: value.rejectedDevValue?.message, commit };
}
