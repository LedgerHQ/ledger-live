import { useCallback } from "react";
import type { FeatureId } from "@shared/feature-flags";
import type { FeatureFlagsToolProps, FlagDisplayState } from "../types";

export interface FeatureFlagsToolState {
  getFlagDisplayState: (id: FeatureId) => FlagDisplayState;
}

export function useFeatureFlagsState(props: FeatureFlagsToolProps): FeatureFlagsToolState {
  const { overrides, resolved } = props;

  const getFlagDisplayState = useCallback(
    (id: FeatureId): FlagDisplayState => ({
      id,
      resolved: resolved[id],
      override: overrides[id],
      isOverridden: !!overrides[id],
    }),
    [overrides, resolved],
  );

  return { getFlagDisplayState };
}
