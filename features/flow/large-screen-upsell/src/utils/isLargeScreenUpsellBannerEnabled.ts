import type { Features } from "@shared/feature-flags";

export type LargeScreenUpsellBannerPlacement = keyof NonNullable<
  NonNullable<Features["largeScreenUpsell"]["params"]>["banners"]
>;

export function isLargeScreenUpsellBannerEnabled(
  feature: Features["largeScreenUpsell"] | null | undefined,
  placement: LargeScreenUpsellBannerPlacement,
): boolean {
  return Boolean(feature?.enabled && (feature.params?.banners?.[placement] ?? true));
}
