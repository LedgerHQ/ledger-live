import type { LNSBannerLocation } from "../../types";

export type { LNSBannerLocation } from "../../types";

export type LNSBannerModel = {
  location: LNSBannerLocation;
  isShown: boolean;
  discount?: number;
  tracking: "opted_in" | "opted_out";
  handleCTAPress: () => void;
};
