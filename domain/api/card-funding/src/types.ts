import type { z } from "zod";
import type { CardFundPayloadRequestSchema, CardFundSignedPayloadSchema } from "./schema";

export type CardFundPayloadRequest = z.infer<typeof CardFundPayloadRequestSchema>;
export type CardFundSignedPayload = z.infer<typeof CardFundSignedPayloadSchema>;
