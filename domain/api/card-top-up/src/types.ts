import type { z } from "zod";
import type { CardTopUpPayloadRequestSchema, CardTopUpSignedPayloadSchema } from "./schema";

export type CardTopUpPayloadRequest = z.infer<typeof CardTopUpPayloadRequestSchema>;
export type CardTopUpSignedPayload = z.infer<typeof CardTopUpSignedPayloadSchema>;
