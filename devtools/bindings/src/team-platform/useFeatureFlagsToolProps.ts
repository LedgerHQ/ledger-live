import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setOverride, setAllOverrides, featureFlagsOverridesSelector } from "@shared/feature-flags";
import { useFeatureFlags } from "@features/platform-feature-flags";
import type { DevToolsConfig } from "@devtools/registry";

type FeatureFlagsToolProps = Extract<DevToolsConfig[number], { id: "feature-flags" }>["config"];
type FeatureFlagsToolActions = Omit<FeatureFlagsToolProps, "overrides" | "resolved">;

/**
 * Builds the feature-flags tool's props from the host's redux store. Reads the
 * `featureFlags` slice (`@shared/feature-flags`) and the resolved flags
 * (`@features/platform-feature-flags`) directly, so apps consume this instead of
 * re-implementing the wiring in each app.
 */
export function useFeatureFlagsToolProps(): FeatureFlagsToolProps {
  const dispatch = useDispatch();
  const overrides = useSelector(featureFlagsOverridesSelector);
  const resolved = useFeatureFlags();

  const actions = useMemo<FeatureFlagsToolActions>(
    () => ({
      setOverride: (key, value) => dispatch(setOverride({ key, value })),
      setAllOverrides: next => dispatch(setAllOverrides(next)),
      clearOverride: key => dispatch(setOverride({ key, value: undefined })),
      clearAllOverrides: () => dispatch(setAllOverrides({})),
    }),
    [dispatch],
  );

  return useMemo(() => ({ overrides, resolved, ...actions }), [overrides, resolved, actions]);
}
