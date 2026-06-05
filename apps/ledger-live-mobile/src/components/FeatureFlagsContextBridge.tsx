import React, { useCallback, useMemo } from "react";
import { useSelector, useDispatch } from "~/context/hooks";
import { FeatureFlagsProvider } from "@ledgerhq/live-common/featureFlags/index";
import { FeatureId, Feature } from "@ledgerhq/types-live";
import {
  FeatureIdSchema,
  setOverride,
  setAllOverrides,
  type WithFeatureFlags,
} from "@shared/feature-flags";

/**
 * Bridges the Redux feature-flags slice to live-common's `FeatureFlagsContext` so
 * live-common's own internal hooks resolve from the slice. Temporary: removed once those
 * hooks migrate off the Context.
 */
export function FeatureFlagsContextBridge({ children }: React.PropsWithChildren) {
  const resolved = useSelector((state: WithFeatureFlags) => state.featureFlags.resolved);
  const dispatch = useDispatch();

  const getFeature = useCallback(
    (key: FeatureId): Feature | null =>
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      (resolved[key as keyof typeof resolved] ?? null) as Feature | null,
    [resolved],
  );

  const isFeature = useCallback(
    (key: string): boolean => FeatureIdSchema.safeParse(key).success,
    [],
  );

  const overrideFeature = useCallback(
    (key: FeatureId, value: Feature): void => {
      const { overriddenByEnv: _ignored, ...pureValue } = value;
      dispatch(setOverride({ key, value: { ...pureValue, overridesRemote: true } }));
    },
    [dispatch],
  );

  const resetFeature = useCallback(
    (key: FeatureId): void => {
      dispatch(setOverride({ key, value: undefined }));
    },
    [dispatch],
  );

  const resetFeatures = useCallback((): void => {
    dispatch(setAllOverrides({}));
  }, [dispatch]);

  const contextValue = useMemo(
    () => ({ isFeature, getFeature, overrideFeature, resetFeature, resetFeatures }),
    [isFeature, getFeature, overrideFeature, resetFeature, resetFeatures],
  );

  return <FeatureFlagsProvider value={contextValue}>{children}</FeatureFlagsProvider>;
}
