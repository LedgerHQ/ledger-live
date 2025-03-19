export type { LNSBannerLocation } from "../../types";

export type LNSBannerModel = {
  isShown: boolean;
  discount?: number;
  tracking: "opted_in" | "opted_out";
  handleCTAPress: () => void;
};
