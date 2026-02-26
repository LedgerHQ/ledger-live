import { OptionalFeatureMap } from "@ledgerhq/types-live";

export const EARN_V2_DESKTOP_FLAGS: OptionalFeatureMap = {
  ptxEarnLiveApp: { enabled: true, params: { manifest_id: "earn-stg-eks" } },
  ptxEarnUi: { enabled: true, params: { value: "v2" } },
  lwdWallet40: {
    enabled: true,
    params: { marketBanner: true, graphRework: true, quickActionCtas: true },
  },
};
