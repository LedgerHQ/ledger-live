import { z } from "zod";
import { flagWith } from "../../define";

export const deviceOnboarding = flagWith(
  {
    offerLedgerSync: z.boolean(),
    connectSeededDevice: z.boolean().default(false),
    connectUnseededDevice: z.boolean().default(false),
  },
  {
    enabled: false,
    params: { offerLedgerSync: false, connectSeededDevice: false, connectUnseededDevice: false },
  },
);
