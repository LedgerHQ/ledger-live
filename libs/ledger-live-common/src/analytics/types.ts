import type { Feature, FeatureId, Features } from "@ledgerhq/types-live";

export type AnalyticsFeatureFlagMethod =
  | (<T extends FeatureId>(key: T) => Features[T] | null)
  | (<T extends FeatureId>(key: T) => Feature<Features[T]["params"]> | null);

export type Platform = "lwm" | "lwd";
