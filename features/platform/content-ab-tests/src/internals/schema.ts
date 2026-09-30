import { z } from "zod";

/** Schema that validates an enabled `feature_copy_*` Remote Config experiment. */
export const EnabledContentAbTestCopySchema = z.object({
  enabled: z.literal(true),
  copy: z.record(z.string(), z.string()),
});
