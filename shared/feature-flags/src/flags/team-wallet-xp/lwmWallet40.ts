import { z } from "zod";
import { flagWith } from "../../define";

export const lwmWallet40 = flagWith(
  {
    lazyOnboarding: z.boolean(),
    brazePlacement: z.boolean().optional(),
    earnUpselling: z.boolean().optional(),
    earnSimulator: z.boolean().optional(),
  },
  {
    enabled: true,
    params: {
      lazyOnboarding: true,
      earnUpselling: false,
      earnSimulator: false,
    },
  },
);
