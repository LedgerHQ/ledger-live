import { z } from "zod";
import { flagWith } from "../../define";

export const lwmWallet40 = flagWith(
  {
    lazyOnboarding: z.boolean(),
    assetSection: z.boolean(),
    aggregatedAssets: z.boolean(),
    brazePlacement: z.boolean().optional(),
    assetDiscoverability: z.boolean(),
    earnUpselling: z.boolean().optional(),
    earnSimulator: z.boolean().optional(),
  },
  {
    enabled: true,
    params: {
      lazyOnboarding: true,
      assetSection: false,
      aggregatedAssets: false,
      assetDiscoverability: false,
      earnUpselling: false,
      earnSimulator: false,
    },
  },
);
