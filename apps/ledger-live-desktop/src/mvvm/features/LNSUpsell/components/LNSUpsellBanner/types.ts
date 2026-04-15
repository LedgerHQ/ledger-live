import { Icons } from "@ledgerhq/react-ui";
import type { LNSBannerLocation } from "LLD/features/LNSUpsell/types";

export type LNSBannerModel = {
  location: LNSBannerLocation;
  variant: LNSBannerVariant;
  discount?: number;
  tracking: "opted_in" | "opted_out";
  handleCTAClick: () => void;
  imageUrl: string;
  shouldUseLumenMediaBanner: boolean;
};

export type LNSBannerVariant =
  | { type: "none" }
  | { type: "banner"; image?: string }
  | { type: "notification"; icon: keyof typeof Icons };
