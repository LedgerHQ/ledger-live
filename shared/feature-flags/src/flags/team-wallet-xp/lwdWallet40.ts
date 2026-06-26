import { z } from "zod";
import { flagWith } from "../../define";

export const lwdWallet40 = flagWith(
  {
    graphRework: z.boolean(),
    mainNavigation: z.boolean(),
    tour: z.boolean(),
    q2Tour: z.boolean(),
    lazyOnboarding: z.boolean(),
    balanceRefreshRework: z.boolean(),
    assetSection: z.boolean(),
    operationsList: z.boolean(),
    brazePlacement: z.boolean().optional(),
    aggregatedAssets: z.boolean(),
    myWallet: z.boolean(),
    pnl: z.boolean(),
    assetDiscoverability: z.boolean(),
    earnUpselling: z.boolean().optional(),
    earnSimulator: z.boolean().optional(),
  },
  {
    enabled: true,
    params: {
      graphRework: true,
      mainNavigation: true,
      tour: true,
      q2Tour: false,
      lazyOnboarding: true,
      balanceRefreshRework: true,
      assetSection: false,
      operationsList: false,
      brazePlacement: true,
      aggregatedAssets: false,
      myWallet: false,
      pnl: false,
      assetDiscoverability: false,
      earnUpselling: false,
      earnSimulator: false,
    },
  },
);
