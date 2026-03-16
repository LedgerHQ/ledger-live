import { z } from "zod";
import { flagWithRecord } from "../../define";

const blockchainConfigSchema = z.object({
  enabled: z.boolean(),
  supportLink: z.string(),
  direct: z.boolean(),
});

export const receiveStakingFlowConfigDesktop = flagWithRecord(
  z.record(z.string(), blockchainConfigSchema),
);
