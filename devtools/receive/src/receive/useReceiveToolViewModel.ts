import { useCallback, useState } from "react";
import type { ReceiveToolProps } from "../types";
import { DEFAULT_RECEIVE_DEEPLINK, parseFamilies } from "./copy";

/** Local UI state of the tool: the excluded families and deeplink drafts, applied on demand. */
export function useReceiveToolViewModel({ flag, trigger }: ReceiveToolProps) {
  const [excludedDraft, setExcludedDraft] = useState(flag.excludedFamilies.join(", "));
  const [deeplinkDraft, setDeeplinkDraft] = useState(DEFAULT_RECEIVE_DEEPLINK);

  const applyExcludedFamilies = useCallback(
    () => flag.setExcludedFamilies(parseFamilies(excludedDraft)),
    [flag, excludedDraft],
  );

  const openDeeplink = useCallback(
    () => trigger.onOpenDeeplink(deeplinkDraft),
    [trigger, deeplinkDraft],
  );

  return {
    flag,
    trigger,
    excludedDraft,
    setExcludedDraft,
    applyExcludedFamilies,
    deeplinkDraft,
    setDeeplinkDraft,
    openDeeplink,
  };
}
