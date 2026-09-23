import type { z } from "zod";
import type {
  CardFundCancellationSchema,
  CardFundConfirmationSchema,
  CardFundPayloadRequestSchema,
  CardFundProviderSignatureSchema,
  CardFundRemitRequestSchema,
  CardFundRemitResponseSchema,
  CardFundSignedPayloadSchema,
} from "./schema";

export type CardFundRemitRequest = z.infer<typeof CardFundRemitRequestSchema>;
export type CardFundProviderSignature = z.infer<typeof CardFundProviderSignatureSchema>;
export type CardFundRemitResponse = z.infer<typeof CardFundRemitResponseSchema>;
export type CardFundConfirmation = z.infer<typeof CardFundConfirmationSchema>;
export type CardFundCancellation = z.infer<typeof CardFundCancellationSchema>;
export type CardFundPayloadRequest = z.infer<typeof CardFundPayloadRequestSchema>;
export type CardFundSignedPayload = z.infer<typeof CardFundSignedPayloadSchema>;
