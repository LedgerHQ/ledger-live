import { z } from "zod";
import { flagWith } from "../../define";

export const deviceOnboarding = flagWith(
  { offerLedgerSync: z.boolean() },
  { enabled: false, params: { offerLedgerSync: false } },
);
