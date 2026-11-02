import { z } from "zod";

/**
 * Thunk `extraArgument` contract for every Portfolio-Service-backed api. An empty
 * `portfolioServiceUrl` disables the service — the base query soft-fails rather than throwing, so
 * the app can boot without it configured.
 */
export const PortfolioApiExtraSchema = z.object({
  portfolioServiceUrl: z.string().trim(),
});
