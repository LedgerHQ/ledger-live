import { Icons } from "@ledgerhq/react-ui";

export type LNSBannerModel = {
  variant: LNSBannerVariant;
  discount?: number;
  tracking: "opted_in" | "opted_out";
  handleCTAClick: () => void;
};

export type LNSBannerVariant =
  | { type: "none" }
  | { type: "banner"; image?: string }
  | { type: "notification"; icon: keyof typeof Icons };
