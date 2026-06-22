import { useCallback, useState } from "react";
import type { FeatureId } from "@shared/feature-flags";

export interface FlagSelectionState {
  selectedFlagId: FeatureId | null;
  selectFlag: (id: FeatureId) => void;
  clearSelection: () => void;
}

export function useFlagSelection(): FlagSelectionState {
  const [selectedFlagId, setSelectedFlagId] = useState<FeatureId | null>(null);

  const selectFlag = useCallback((id: FeatureId) => setSelectedFlagId(id), []);
  const clearSelection = useCallback(() => setSelectedFlagId(null), []);

  return { selectedFlagId, selectFlag, clearSelection };
}
