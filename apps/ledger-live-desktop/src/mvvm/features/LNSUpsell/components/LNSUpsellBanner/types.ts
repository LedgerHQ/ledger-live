import type { LnsUpsellCopyKeys } from "@features/flow-large-screen-upsell";
import { Icons } from "@ledgerhq/react-ui";
import type { LNSBannerLocation } from "LLD/features/LNSUpsell/types";

export type LNSBannerModel = {
  location: LNSBannerLocation;
  variant: LNSBannerVariant;
  discount?: number;
  tracking: "opted_in" | "opted_out";
  copyKeys: LnsUpsellCopyKeys;
  handleCTAClick: () => void;
  imageUrl: string;
  shouldUseLumenMediaBanner: boolean;
};

export type LNSBannerVariant =
  | { type: "none" }
  | { type: "banner" }
  | { type: "notification"; icon: keyof typeof Icons };
