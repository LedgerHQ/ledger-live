import { useCallback, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setOverride, setAllOverrides } from "@shared/feature-flags";
import type { Feature, FeatureId } from "@shared/feature-flags";
import type { FeatureFlagsToolProps } from "@devtools/feature-flags";
import type { RootState } from "../store";

export function useFeatureFlagsToolProps(): FeatureFlagsToolProps {
  const dispatch = useDispatch();
  const overrides = useSelector((s: RootState) => s.featureFlags.overrides);
  const resolved = useSelector((s: RootState) => s.featureFlags.resolved);
  const remote = useSelector((s: RootState) => s.featureFlags.remote);

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
      remote,
      setOverride: handleSetOverride,
      clearOverride: handleClearOverride,
      clearAllOverrides: handleClearAllOverrides,
    }),
    [overrides, resolved, remote, handleSetOverride, handleClearOverride, handleClearAllOverrides],
  );
}
