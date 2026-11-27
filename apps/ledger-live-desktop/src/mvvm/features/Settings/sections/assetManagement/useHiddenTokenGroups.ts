import { useEffect, useState } from "react";
import { loadBlacklistedTokenSections } from "@ledgerhq/live-common/account/index";
import type { HiddenTokenGroup } from "@features/flow-settings-asset-management";
import { useSelector } from "LLD/hooks/redux";
import { blacklistedTokenIdsSelector } from "~/renderer/reducers/settings";

type BlacklistedTokenSections = Awaited<ReturnType<typeof loadBlacklistedTokenSections>>;

function toHiddenTokenGroups(sections: BlacklistedTokenSections): HiddenTokenGroup[] {
  return sections.map(({ parentCurrency, assets }) => ({
    network: { id: parentCurrency.id, name: parentCurrency.name },
    tokens: assets.map(({ id, name, ticker }) => ({ id, name, ticker })),
  }));
}

/** The hidden tokens of the legacy store, grouped by network as the legacy Accounts screen does. */
export function useHiddenTokenGroups(): readonly HiddenTokenGroup[] {
  const hiddenTokenIds = useSelector(blacklistedTokenIdsSelector);
  const [groups, setGroups] = useState<readonly HiddenTokenGroup[]>([]);

  useEffect(() => {
    let mounted = true;
    loadBlacklistedTokenSections(hiddenTokenIds)
      .then(sections => {
        if (mounted) setGroups(toHiddenTokenGroups(sections));
      })
      .catch(error => {
        console.warn("Failed to load blacklisted tokens:", error);
        if (mounted) setGroups([]);
      });
    return () => {
      mounted = false;
    };
  }, [hiddenTokenIds]);

  return groups;
}
