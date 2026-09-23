import { z } from "zod";

export const CardFundRemitRequestSchema = z.object({
  quoteId: z.string().min(1).optional(),
  provider: z.string().min(1),
  fromCurrency: z.string().min(1),
  toCurrency: z.string().min(1),
  refundAddress: z.string().min(1),
  amountFrom: z.number().finite().positive(),
  amountTo: z.number().finite().positive(),
  nonce: z.string().min(1),
});

export const CardFundProviderSignatureSchema = z.object({
  payload: z.string().min(1),
  signature: z.string().min(1),
});

export const CardFundRemitResponseSchema = z.object({
  sellId: z.string().min(1),
  payinAddress: z.string().min(1),
  providerSig: CardFundProviderSignatureSchema,
});

export const CardFundConfirmationSchema = z.object({
  orderId: z.string().min(1),
  provider: z.string().min(1),
  transactionId: z.string().min(1),
});

export const CardFundCancellationSchema = z.object({
  orderId: z.string().min(1),
  provider: z.string().min(1),
  statusCode: z.string().min(1),
  errorMessage: z.string().min(1),
});

export const CardFundPayloadRequestSchema = z.object({
  apiBaseUrl: z.string().url(),
  /** The device nonce returned by the Fund `startExchange`. */
  transactionId: z.string().min(1),
  /** Smallest unit of the funded currency (satoshis for BTC). */
  inAmount: z.number().int().positive(),
  /** Provider asset code, e.g. `btc`. */
  currency: z.string().min(1),
  inAddress: z.string().min(1),
});

/** A Node `Buffer` serialized by `JSON.stringify`. */
const SerializedBufferSchema = z.object({
  type: z.literal("Buffer"),
  data: z.array(z.number().int().min(0).max(255)).min(1),
});

export const CardFundPayloadResponseSchema = z.object({
  binaryPayload: SerializedBufferSchema,
  signature: SerializedBufferSchema,
});

/** The provider answers a refusal with HTTP 200 and this body. */
export const CardFundPayloadRefusalSchema = z.object({
  error: z.object({
    status: z.number().optional(),
    message: z.string().min(1),
  }),
});

export const CardFundSignedPayloadSchema = z.object({
  /** Base64url text of the signed Fund protobuf, as the device expects it. */
  payload: z.string().min(1),
  /** Hex of the provider's 64-byte `r || s` signature. */
  signature: z.string().regex(/^[0-9a-f]+$/),
});
