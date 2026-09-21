import type { LnsUpsellCopyKeys } from "@features/flow-large-screen-upsell/utils/getLnsUpsellCopyKeys";

export type LNBannerLocation =
  | "manager"
  | "accounts"
  | "notification_center"
  | "wallet"
  | "profile";

export type LNBannerModel = {
  location: LNBannerLocation;
  isShown: boolean;
  discount?: number;
  tracking: "opted_in" | "opted_out";
  copyKeys: LnsUpsellCopyKeys;
  handleCTAPress: () => void;
  imageUrl: string;
};
