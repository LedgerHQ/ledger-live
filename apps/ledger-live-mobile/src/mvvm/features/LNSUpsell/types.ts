import type { LlmNanoSUpsellBannersConfig } from "@ledgerhq/types-live/lnsUpsell";

export type LNSBannerLocation = Extract<
  "manager" | "accounts" | "notification_center" | "wallet",
  keyof LlmNanoSUpsellBannersConfig
>;
