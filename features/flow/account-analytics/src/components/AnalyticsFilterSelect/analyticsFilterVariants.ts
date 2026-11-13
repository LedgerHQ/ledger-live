import type { CryptoIconProps } from "@ledgerhq/crypto-icons";

export type AnalyticsFilterVariant = "asset" | "account";

/** What the asset and account filters share on both platforms; each platform adds its fallback icon. */
export const ANALYTICS_FILTER_VARIANTS = {
  asset: { testId: "analytics-asset-filter", iconShape: undefined, searchable: true },
  account: { testId: "analytics-account-filter", iconShape: "square", searchable: false },
} as const satisfies Record<
  AnalyticsFilterVariant,
  Readonly<{ testId: string; iconShape: CryptoIconProps["shape"]; searchable: boolean }>
>;
