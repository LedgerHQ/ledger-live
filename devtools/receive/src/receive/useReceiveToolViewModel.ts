import { useCallback, useState } from "react";
import type { ReceiveToolProps } from "../types";
import { parseFamilies } from "./copy";

/** Local UI state of the tool: the excluded families draft, applied on demand. */
export function useReceiveToolViewModel({ flag }: ReceiveToolProps) {
  const [excludedDraft, setExcludedDraft] = useState(flag.excludedFamilies.join(", "));

  const applyExcludedFamilies = useCallback(
    () => flag.setExcludedFamilies(parseFamilies(excludedDraft)),
    [flag, excludedDraft],
  );

  return { flag, excludedDraft, setExcludedDraft, applyExcludedFamilies };
}
