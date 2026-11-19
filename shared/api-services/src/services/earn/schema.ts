import { z } from "zod";

/**
 * Thunk `extraArgument` contract for every Earn-backed api. An empty or malformed `earnApiBaseUrl`
 * disables the service: the base query soft-fails rather than throwing, so the app can boot without
 * it configured.
 */
export const EarnApiExtraSchema = z.object({
  earnApiBaseUrl: z.string().trim(),
});
