import { z } from "zod";
import { flagWith } from "../../define";

export const llmMmkvMigration = flagWith(
  {
    shouldRollback: z.boolean().nullable(),
  },
  {
    enabled: false,
    params: { shouldRollback: false },
  },
);
