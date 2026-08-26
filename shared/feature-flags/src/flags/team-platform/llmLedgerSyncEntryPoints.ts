import { z } from "zod";
import { flagWith } from "../../define";

export const llmLedgerSyncEntryPoints = flagWith(
  {
    manager: z.boolean(),
    accounts: z.boolean(),
    settings: z.boolean(),
    onboarding: z.boolean(),
    postOnboarding: z.boolean(),
    sendFlow: z.boolean(),
  },
  {
    enabled: false,
    params: {
      manager: true,
      accounts: true,
      settings: true,
      onboarding: true,
      postOnboarding: true,
      sendFlow: true,
    },
  },
);
