import { z } from "zod";
import { flagWith } from "../../define";

export const lwmWallet40 = flagWith(
  {
    marketBanner: z.boolean(),
    graphRework: z.boolean(),
    quickActionCtas: z.boolean(),
    mainNavigation: z.boolean(),
    tour: z.boolean(),
    lazyOnboarding: z.boolean(),
    balanceRefreshRework: z.boolean(),
    assetSection: z.boolean(),
    onboardingWidget: z.boolean(),
    newReceiveDialog: z.boolean().optional(),
    operationsList: z.boolean(),
    aggregatedAssets: z.boolean(),
  },
  {
    enabled: false,
    params: {
      marketBanner: true,
      graphRework: true,
      quickActionCtas: true,
      tour: true,
      mainNavigation: true,
      lazyOnboarding: true,
      balanceRefreshRework: true,
      assetSection: true,
      onboardingWidget: true,
      operationsList: true,
      aggregatedAssets: true,
    },
  },
);
