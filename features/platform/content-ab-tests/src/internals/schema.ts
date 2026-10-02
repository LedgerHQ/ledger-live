import { z } from "zod";

/** Schema that validates a `feature_copy_*` Remote Config experiment, enabled or not. */
export const ContentAbTestPayloadSchema = z.object({
  enabled: z.boolean(),
  copy: z.record(z.string(), z.string()),
  trackingConfiguration: z.record(z.string(), z.string()).optional(),
});
