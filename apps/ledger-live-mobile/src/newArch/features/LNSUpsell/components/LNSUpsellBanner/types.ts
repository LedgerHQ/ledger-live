import { LlmNanoSUpsellBannersConfig } from "@ledgerhq/types-live/lib/lnsUpsell";

export type LNSBannerLocation = Extract<
  "manager" | "accounts" | "notification_center" | "wallet",
  keyof LlmNanoSUpsellBannersConfig
>;

export type LNSBannerModel = {
  isShown: boolean;
  discount?: number;
  tracking: "opted_in" | "opted_out";
  handleCTAPress: () => void;
};
