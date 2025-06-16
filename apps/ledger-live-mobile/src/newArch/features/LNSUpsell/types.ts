import type { LlmNanoSUpsellBannersConfig } from "@ledgerhq/types-live/lib/lnsUpsell";

export type LNSBannerLocation = Extract<
  "manager" | "accounts" | "notification_center" | "wallet",
  keyof LlmNanoSUpsellBannersConfig
>;
