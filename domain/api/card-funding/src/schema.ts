import { z } from "zod";

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
