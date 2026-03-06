import { OptionalFeatureMap } from "@ledgerhq/types-live";

// TODO: remove when wallet 4.0 is default
export const LWD_WALLET_40_FLAGS: OptionalFeatureMap = {
  lwdWallet40: {
    enabled: true,
    params: {
      marketBanner: true,
      graphRework: true,
      quickActionCtas: true,
      mainNavigation: true,
    },
  },
};
