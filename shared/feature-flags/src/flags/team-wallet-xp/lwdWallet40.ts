import { z } from "zod";
import { flagWith } from "../../define";

export const lwdWallet40 = flagWith(
  {
    marketBanner: z.boolean(),
    graphRework: z.boolean(),
    quickActionCtas: z.boolean(),
    mainNavigation: z.boolean(),
    tour: z.boolean(),
    lazyOnboarding: z.boolean(),
    balanceRefreshRework: z.boolean(),
    assetSection: z.boolean(),
    newReceiveDialog: z.boolean(),
    operationsList: z.boolean(),
    brazePlacement: z.boolean().optional(),
    aggregatedAssets: z.boolean(),
    myWallet: z.boolean(),
    finishOnboardingWidget: z.boolean().optional(),
    pnl: z.boolean(),
  },
  {
    enabled: false,
    params: {
      marketBanner: true,
      graphRework: true,
      quickActionCtas: true,
      mainNavigation: true,
      tour: true,
      lazyOnboarding: true,
      newReceiveDialog: true,
      balanceRefreshRework: true,
      assetSection: true,
      operationsList: true,
      brazePlacement: true,
      aggregatedAssets: true,
      myWallet: true,
      finishOnboardingWidget: false,
      pnl: true,
    },
  },
);
