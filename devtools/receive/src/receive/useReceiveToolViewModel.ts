import { useCallback, useMemo, useState } from "react";
import type { ReceiveToolProps } from "../types";
import { copy, matchesSearch, parseFamilies } from "./copy";

/** Local UI state of the tool: the asset search and the excluded families draft. */
export function useReceiveToolViewModel({ flag, verifyHint, trigger }: ReceiveToolProps) {
  const [search, setSearch] = useState("");
  const [excludedDraft, setExcludedDraft] = useState(flag.excludedFamilies.join(", "));
  const [deeplink, setDeeplink] = useState<string>(copy.defaultDeeplink);

  const assets = useMemo(
    () => trigger.assets.filter(asset => matchesSearch(search, asset.label, asset.ticker)),
    [trigger.assets, search],
  );

  const applyExcludedFamilies = useCallback(
    () => flag.setExcludedFamilies(parseFamilies(excludedDraft)),
    [flag, excludedDraft],
  );

  const openDeeplink = useCallback(() => {
    const url = deeplink.trim();
    if (url) trigger.onOpenDeeplink(url);
  }, [trigger, deeplink]);

  return {
    flag,
    verifyHint,
    trigger,
    assets,
    search,
    setSearch,
    excludedDraft,
    setExcludedDraft,
    applyExcludedFamilies,
    deeplink,
    setDeeplink,
    openDeeplink,
  };
}
