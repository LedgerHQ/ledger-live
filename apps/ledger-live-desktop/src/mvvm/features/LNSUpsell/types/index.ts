import type { Features } from "@shared/feature-flags";

export type LNSBannerLocation = "manager" | "accounts" | "notification_center" | "portfolio";

export type LNSBannerState = {
  isShown: boolean;
  tracking: "opted_in" | "opted_out";
  ctaLink?: string;
  discountPercent?: number;
};

type LargeScreenUpsellParams = NonNullable<Features["largeScreenUpsell"]["params"]>;
export type LargeScreenUpsellBannerPlacement = keyof LargeScreenUpsellParams["banners"];

export const BANNER_PLACEMENT_BY_LOCATION = {
  manager: "my-ledger",
  accounts: "accounts",
  notification_center: "notification-center",
  portfolio: "homepage",
} as const satisfies Record<LNSBannerLocation, LargeScreenUpsellBannerPlacement>;
