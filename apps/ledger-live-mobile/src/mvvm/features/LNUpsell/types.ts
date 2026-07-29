export type LNBannerLocation = "manager" | "accounts" | "notification_center" | "wallet";

export type LNBannerModel = {
  location: LNBannerLocation;
  isShown: boolean;
  tracking: "opted_in" | "opted_out";
  handleCTAPress: () => void;
  imageUrl: string;
};
