import { useCallback, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setOverride, setAllOverrides, featureFlagsOverridesSelector } from "@shared/feature-flags";
import type { Feature, FeatureId } from "@shared/feature-flags";
import type { DevToolsConfig } from "@devtools/shell";
import { useFeatureFlags } from "@features/platform-feature-flags";

type FeatureFlagsToolProps = Extract<DevToolsConfig[number], { id: "feature-flags" }>["config"];

export function useFeatureFlagsToolProps(): FeatureFlagsToolProps {
  const dispatch = useDispatch();
  const overrides = useSelector(featureFlagsOverridesSelector);
  const resolved = useFeatureFlags();

  const handleSetOverride = useCallback(
    (key: FeatureId, value: Feature | undefined) => dispatch(setOverride({ key, value })),
    [dispatch],
  );

  const handleClearOverride = useCallback(
    (key: FeatureId) => dispatch(setOverride({ key, value: undefined })),
    [dispatch],
  );

  const handleClearAllOverrides = useCallback(() => dispatch(setAllOverrides({})), [dispatch]);

  return useMemo(
    () => ({
      overrides,
      resolved,
      setOverride: handleSetOverride,
      clearOverride: handleClearOverride,
      clearAllOverrides: handleClearAllOverrides,
    }),
    [overrides, resolved, handleSetOverride, handleClearOverride, handleClearAllOverrides],
  );
}
