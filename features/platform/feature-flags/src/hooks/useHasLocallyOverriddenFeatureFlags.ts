import { useSelector } from "react-redux";
import type { WithFeatureFlags } from "@shared/feature-flags";

/**
 * Hook that returns whether the user has any locally-set feature flag overrides.
 *
 * Reads directly from `state.featureFlags.overrides` — any key present means a
 * local override has been applied via `setOverride` or `setAllOverrides`. This
 * is more accurate than inspecting `resolved`, because the resolution chain does
 * not mark locally-overridden flags with `overridesRemote` (only env flags get
 * that marker).
 *
 * @returns
 * `true` if at least one local override is active, `false` otherwise.
 */
export function useHasLocallyOverriddenFeatureFlags(): boolean {
  return useSelector(
    (state: WithFeatureFlags) => Object.keys(state.featureFlags.overrides).length > 0,
  );
}
