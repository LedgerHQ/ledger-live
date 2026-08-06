import type { z } from "zod";
import type { PayCardPreAuthResponseSchema, PayCardProviderSchema } from "./schema";

export type PayCardProvider = z.infer<typeof PayCardProviderSchema>;

export type PayCardPreAuth = z.infer<typeof PayCardPreAuthResponseSchema>;
