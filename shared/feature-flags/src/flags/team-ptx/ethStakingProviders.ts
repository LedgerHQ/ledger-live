import { z } from "zod";
import { flagWith } from "../../define";

const ethStakingProviderCategorySchema = z.enum(["liquid", "pooling", "protocol", "restaking"]);
const ethStakingProviderRewardsStrategySchema = z.enum([
  "basic",
  "auto-compounded",
  "daily",
  "eigenlayer_points",
  "validator",
]);

const ethStakingProviderSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: ethStakingProviderCategorySchema,
  rewardsStrategy: ethStakingProviderRewardsStrategySchema,
  min: z.number().optional(),
  disabled: z.boolean().optional(),
  icon: z.string().optional(),
  liveAppId: z.string(),
  lst: z.boolean().optional(),
  queryParams: z.record(z.string(), z.string()).optional(),
  supportLink: z.string().optional(),
});

export const ethStakingProviders = flagWith({
  listProvider: z.array(ethStakingProviderSchema),
});
