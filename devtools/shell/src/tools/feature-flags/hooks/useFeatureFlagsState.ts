import { useCallback, useMemo, useState } from "react";
import { FeatureIdSchema } from "@shared/feature-flags";
import type { FeatureId } from "@shared/feature-flags";
import type { FeatureFlagsToolProps, FlagDisplayState } from "../types";

export interface FeatureFlagsToolState {
  flagIds: FeatureId[];
  filteredFlagIds: FeatureId[];
  search: string;
  setSearch: (value: string) => void;
  getFlagDisplayState: (id: FeatureId) => FlagDisplayState;
}

const ALL_FLAG_IDS: FeatureId[] = [...FeatureIdSchema.options].sort();

export function useFeatureFlagsState(props: FeatureFlagsToolProps): FeatureFlagsToolState {
  const { overrides, resolved, defaults, remote } = props;
  const [search, setSearch] = useState("");

  const flagIds = ALL_FLAG_IDS;

  const filteredFlagIds = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ALL_FLAG_IDS;
    return ALL_FLAG_IDS.filter(id => id.toLowerCase().includes(q));
  }, [search]);

  const getFlagDisplayState = useCallback(
    (id: FeatureId): FlagDisplayState => ({
      id,
      resolved: resolved[id],
      override: overrides[id],
      remote: remote?.[id],
      default: defaults?.[id],
      isOverridden: !!overrides[id],
    }),
    [overrides, resolved, remote, defaults],
  );

  return { flagIds, filteredFlagIds, search, setSearch, getFlagDisplayState };
}
