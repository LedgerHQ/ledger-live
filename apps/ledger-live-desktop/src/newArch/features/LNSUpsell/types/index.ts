import { Feature_LldNanoSUpsellBanners } from "@ledgerhq/types-live";

export * from "./enum/Analytics";

export type LNSBannerModel = {
  location: LNSBannerLocation;
  discount: number;
  tracking: string;
  image: string;
  handleCTAClick: () => void;
  handleLearnMoreLink: () => void;
};

export type LNSBannerLocation = Extract<
  "manager" | "accounts" | "notification_center",
  keyof Required<Feature_LldNanoSUpsellBanners>["params"]["opted_in"]
>;
