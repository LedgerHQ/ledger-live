import { z } from "zod";

/** Card providers this flow can log in against. */
export const PayCardProviderSchema = z.enum(["baanx"]);

/**
 * Wire contract for the Card API endpoint this flow calls. It is parsed before the response reaches
 * the flow, so a backend change surfaces here rather than in a view model.
 */
export const PayCardPreAuthResponseSchema = z.object({
  loginUrl: z.string().url(),
});

export const PayCardParamsSchema = z.object({
  platform: z.string(),
  name: z.string(),
  path: z.string().optional(),
});
