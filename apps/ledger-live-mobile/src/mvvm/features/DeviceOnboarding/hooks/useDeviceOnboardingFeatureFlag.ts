import { useCallback, useMemo } from "react";
import { useFeature } from "@features/platform-feature-flags";
import { setOverride } from "@shared/feature-flags";
import { useDispatch } from "~/context/hooks";
import type { DeviceOnboardingToolProps } from "../utils/toolState";

type FeatureFlag = NonNullable<DeviceOnboardingToolProps["featureFlag"]>;

export function useDeviceOnboardingFeatureFlag(): Pick<
  DeviceOnboardingToolProps,
  "featureFlag" | "setFeatureFlag"
> {
  const feature = useFeature("deviceOnboarding");
  const dispatch = useDispatch();

  const featureFlag = useMemo<FeatureFlag | undefined>(
    () => (feature ? { enabled: feature.enabled, params: { ...feature.params } } : undefined),
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
            params: { ...feature.params, offerLedgerSync: Boolean(params.offerLedgerSync) },
          },
        }),
      );
    },
    [dispatch, feature],
  );

  return useMemo(() => ({ featureFlag, setFeatureFlag }), [featureFlag, setFeatureFlag]);
}
