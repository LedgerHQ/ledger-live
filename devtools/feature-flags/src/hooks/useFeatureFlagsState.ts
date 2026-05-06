import { useCallback } from "react";
import type { FeatureId } from "@shared/feature-flags";
import type { FeatureFlagsToolProps, FlagDisplayState } from "../types";

export interface FeatureFlagsToolState {
  getFlagDisplayState: (id: FeatureId) => FlagDisplayState;
}

export function useFeatureFlagsState(props: FeatureFlagsToolProps): FeatureFlagsToolState {
  const { overrides, resolved, defaults, remote } = props;

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

  return { getFlagDisplayState };
}
