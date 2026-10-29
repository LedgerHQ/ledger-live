import { z } from "zod";
import { flagWith } from "../../define";

export const lwdWallet40 = flagWith(
  {
    lazyOnboarding: z.boolean(),
    assetSection: z.boolean(),
    brazePlacement: z.boolean().optional(),
    earnUpselling: z.boolean().optional(),
    earnSimulator: z.boolean().optional(),
  },
  {
    enabled: true,
    params: {
      lazyOnboarding: true,
      assetSection: false,
      brazePlacement: true,
      earnUpselling: false,
      earnSimulator: false,
    },
  },
);
