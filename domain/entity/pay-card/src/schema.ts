import { z } from "zod";

export const PayCardParamsSchema = z.object({
  platform: z.string(),
  name: z.string(),
  path: z.string().optional(),
});

export type PayCardParams = z.infer<typeof PayCardParamsSchema>;
