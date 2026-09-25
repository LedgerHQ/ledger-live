import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { CardTopUpPayloadRefusalSchema, CardTopUpPayloadResponseSchema } from "./schema";
import type { CardTopUpSignedPayload } from "./types";

type CardTopUpPayloadResult =
  | { data: CardTopUpSignedPayload; error?: undefined }
  | { error: FetchBaseQueryError; data?: undefined };

function toHex(bytes: readonly number[]): string {
  return bytes.map(byte => byte.toString(16).padStart(2, "0")).join("");
}

export function readCardTopUpPayload(body: unknown): CardTopUpPayloadResult {
  const refusal = CardTopUpPayloadRefusalSchema.safeParse(body);
  if (refusal.success) {
    return {
      error: {
        status: "CUSTOM_ERROR",
        error: refusal.data.error.message,
        data: refusal.data.error,
      },
    };
  }

  const signed = CardTopUpPayloadResponseSchema.safeParse(body);
  if (!signed.success) {
    return {
      error: {
        status: "CUSTOM_ERROR",
        error: "The provider answered without a signed Fund payload",
      },
    };
  }

  return {
    data: {
      payload: String.fromCharCode(...signed.data.binaryPayload.data),
      signature: toHex(signed.data.signature.data),
    },
  };
}
