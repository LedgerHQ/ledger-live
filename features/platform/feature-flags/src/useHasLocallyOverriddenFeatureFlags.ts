import { useSelector } from "react-redux";
import type { FeatureFlagsState } from "@shared/feature-flags";

type WithFeatureFlags = { featureFlags: FeatureFlagsState };

export const useHasLocallyOverriddenFeatureFlags = (): boolean =>
  useSelector((state: WithFeatureFlags) =>
    Object.values(state.featureFlags.resolved).some(v => v?.overridesRemote || v?.overriddenByEnv),
  );
