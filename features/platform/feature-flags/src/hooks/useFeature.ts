import { useSelector } from "react-redux";
import {
  selectFeature,
  type FeatureId,
  type Features,
  type WithFeatureFlags,
} from "@shared/feature-flags";

/**
 * Hook to select a feature flag by its identifier.

 * @param key
 * The feature flag identifier.
 *
 * @returns
 * The resolved feature flag, or null if not found.
 */
export function useFeature<T extends FeatureId>(key: T): Features[T] | null {
  return useSelector((state: WithFeatureFlags) => selectFeature(state, key));
}
