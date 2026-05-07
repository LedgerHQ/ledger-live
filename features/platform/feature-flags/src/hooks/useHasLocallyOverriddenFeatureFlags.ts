import { useSelector } from "react-redux";
import type { WithFeatureFlags } from "@shared/feature-flags";

/**
 * Hook that returns whether there are any locally overridden feature flags.
 *
 * @returns
 * `true` if there are locally overridden feature flags, `false` otherwise.
 */
export function useHasLocallyOverriddenFeatureFlags(): boolean {
  return useSelector((state: WithFeatureFlags) =>
    Object.values(state.featureFlags.resolved).some(v => v?.overridesRemote || v?.overriddenByEnv),
  );
}
