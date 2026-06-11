import React, { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { FeatureFlagsProvider } from "@ledgerhq/live-common/featureFlags/index";
import { Feature, FeatureId } from "@ledgerhq/types-live";
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
export const FeatureFlagsContextBridge = ({ children }: React.PropsWithChildren) => {
  const dispatch = useDispatch();
  const resolved = useSelector((state: WithFeatureFlags) => state.featureFlags.resolved);

  const getFeature = useCallback(
    (key: FeatureId): Feature | null => {
      const parsed = FeatureIdSchema.safeParse(key);
      if (!parsed.success) return null;
      // Cast bridges the slice's Feature to live-common's types-live Feature.
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      return (resolved[parsed.data] ?? null) as Feature | null;
    },
    [resolved],
  );

  const isFeature = useCallback(
    (key: string): boolean => FeatureIdSchema.safeParse(key).success,
    [],
  );

  const overrideFeature = useCallback(
    (key: FeatureId, value: Feature): void => {
      const parsed = FeatureIdSchema.safeParse(key);
      if (!parsed.success) return;
      const { overriddenByEnv, ...pureValue } = value; // eslint-disable-line
      dispatch(setOverride({ key: parsed.data, value: { ...pureValue, overridesRemote: true } }));
    },
    [dispatch],
  );

  const resetFeature = useCallback(
    (key: FeatureId): void => {
      const parsed = FeatureIdSchema.safeParse(key);
      if (!parsed.success) return;
      dispatch(setOverride({ key: parsed.data, value: undefined }));
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
};
