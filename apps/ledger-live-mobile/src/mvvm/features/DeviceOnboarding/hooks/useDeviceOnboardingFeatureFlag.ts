import { useCallback, useMemo } from "react";
import { useFeature } from "@features/platform-feature-flags";
import { featureFlagsOverridesSelector, flagRegistry, setOverride } from "@shared/feature-flags";
import { useDispatch, useSelector } from "~/context/hooks";
import type { DeviceOnboardingToolProps } from "../utils/toolState";

type FeatureFlag = NonNullable<DeviceOnboardingToolProps["featureFlag"]>;

// A saved value can predate a new param, so every param starts from its default.
const defaultParams = flagRegistry.deviceOnboarding.parse(undefined).params;

export function useDeviceOnboardingFeatureFlag(): Pick<
  DeviceOnboardingToolProps,
  "featureFlag" | "setFeatureFlag" | "isFeatureFlagOverridden" | "resetFeatureFlag"
> {
  const feature = useFeature("deviceOnboarding");
  const isFeatureFlagOverridden = useSelector(
    state => featureFlagsOverridesSelector(state).deviceOnboarding !== undefined,
  );
  const dispatch = useDispatch();

  const featureFlag = useMemo<FeatureFlag | undefined>(
    () =>
      feature
        ? { enabled: feature.enabled, params: { ...defaultParams, ...feature.params } }
        : undefined,
    [feature],
  );

  const setFeatureFlag = useCallback(
    ({ enabled, params }: FeatureFlag) => {
      if (!feature) return;
      dispatch(
        setOverride({
          key: "deviceOnboarding",
          value: {
            ...feature,
            enabled,
            params: { ...defaultParams, ...feature.params, ...params },
          },
        }),
      );
    },
    [dispatch, feature],
  );

  const resetFeatureFlag = useCallback(() => {
    dispatch(setOverride({ key: "deviceOnboarding", value: undefined }));
  }, [dispatch]);

  return useMemo(
    () => ({ featureFlag, setFeatureFlag, isFeatureFlagOverridden, resetFeatureFlag }),
    [featureFlag, isFeatureFlagOverridden, resetFeatureFlag, setFeatureFlag],
  );
}
