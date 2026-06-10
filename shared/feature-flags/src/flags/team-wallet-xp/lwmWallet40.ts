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
    newReceiveDialog: z.boolean().optional(),
    operationsList: z.boolean(),
    aggregatedAssets: z.boolean(),
    myWallet: z.boolean(),
    brazePlacement: z.boolean().optional(),
    pnl: z.boolean(),
    assetDiscoverability: z.boolean(),
    earnUpselling: z.boolean().optional(),
    earnSimulator: z.boolean().optional(),
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
      assetSection: false,
      operationsList: false,
      aggregatedAssets: false,
      myWallet: false,
      pnl: false,
      assetDiscoverability: false,
      earnUpselling: false,
      earnSimulator: false,
    },
  },
);
