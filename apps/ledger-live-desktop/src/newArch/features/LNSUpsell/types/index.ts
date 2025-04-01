import { Feature_LldNanoSUpsellBanners } from "@ledgerhq/types-live";

export type LNSBannerState = {
  isShown: boolean;
  tracking: Tracking;
  params?: FFParams[Tracking];
};

export type LNSBannerLocation = Extract<
  "manager" | "accounts" | "notification_center" | "portfolio",
  keyof FFParams["opted_in"] | keyof FFParams["opted_out"]
>;

type Tracking = "opted_in" | "opted_out";
type FFParams = Required<Feature_LldNanoSUpsellBanners>["params"];
