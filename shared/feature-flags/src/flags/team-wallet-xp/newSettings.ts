import { z } from "zod";
import { flagWith } from "../../define";

export const newSettings = flagWith(
  {
    hideMyLedgerProvider: z.boolean(),
    hideMockAppUpdate: z.boolean(),
  },
  {
    enabled: false,
    params: { hideMyLedgerProvider: false, hideMockAppUpdate: false },
  },
);
