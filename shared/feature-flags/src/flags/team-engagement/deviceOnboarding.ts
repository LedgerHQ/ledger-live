import { z } from "zod";
import { flagWith } from "../../define";

export const deviceOnboarding = flagWith(
  {
    offerLedgerSync: z.boolean(),
    connectSeededDevice: z.boolean().default(false),
    connectUnseededDevice: z.boolean().default(false),
    unifiedEntryPoints: z.boolean().default(false),
    recover: z.boolean().default(true),
  },
  {
    enabled: false,
    params: {
      offerLedgerSync: false,
      connectSeededDevice: false,
      connectUnseededDevice: false,
      unifiedEntryPoints: false,
      recover: true,
    },
  },
);
