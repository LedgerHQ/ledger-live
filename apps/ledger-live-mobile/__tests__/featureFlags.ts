import { FEATURE_FLAGS_DEFAULTS } from "@shared/feature-flags";
import { FeatureId, Feature, Features } from "@ledgerhq/types-live";

/* getFeature provides a basic behavior to mock how we retrieve feature flags values
 * and allows overrides for our tests
 */
export const getFeature = <T extends FeatureId>({
  key,
  localOverrides,
}: {
  key: T;
  appLanguage?: string;
  allowOverride?: boolean;
  localOverrides?: { [key in FeatureId]?: Feature | undefined };
}): Features[T] => {
  if (localOverrides?.[key]) return localOverrides?.[key] as Features[T];
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return FEATURE_FLAGS_DEFAULTS[key] as unknown as Features[T];
};
