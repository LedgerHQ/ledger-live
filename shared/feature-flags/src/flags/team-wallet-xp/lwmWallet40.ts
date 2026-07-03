import { z } from "zod";
import { flagWith } from "../../define";

export const lwmWallet40 = flagWith(
  {
    graphRework: z.boolean(),
    quickActionCtas: z.boolean(),
    tour: z.boolean(),
    lazyOnboarding: z.boolean(),
    assetSection: z.boolean(),
    operationsList: z.boolean(),
    aggregatedAssets: z.boolean(),
    myWallet: z.boolean(),
    brazePlacement: z.boolean().optional(),
    pnl: z.boolean(),
    assetDiscoverability: z.boolean(),
    earnUpselling: z.boolean().optional(),
    earnSimulator: z.boolean().optional(),
    q2Tour: z.boolean().optional(),
  },
  {
    enabled: false,
    params: {
      graphRework: true,
      quickActionCtas: true,
      tour: true,
      lazyOnboarding: true,
      assetSection: false,
      operationsList: false,
      aggregatedAssets: false,
      myWallet: false,
      pnl: false,
      assetDiscoverability: false,
      earnUpselling: false,
      earnSimulator: false,
      q2Tour: false,
    },
  },
);
