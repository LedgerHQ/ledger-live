import { useCallback } from "react";
import { FeatureIdSchema } from "@shared/feature-flags";
import type { FeatureId } from "@shared/feature-flags";
import type { FeatureFlagsToolProps, FlagDisplayState } from "../types";

export interface FeatureFlagsToolState {
  flagIds: FeatureId[];
  getFlagDisplayState: (id: FeatureId) => FlagDisplayState;
}

export const ALL_FLAG_IDS: FeatureId[] = [...FeatureIdSchema.options].sort();

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

  return { flagIds: ALL_FLAG_IDS, getFlagDisplayState };
}
