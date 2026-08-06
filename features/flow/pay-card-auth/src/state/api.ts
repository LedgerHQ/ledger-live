import { payCardApi } from "@shared/api-services";
import { PayCardPreAuthResponseSchema } from "./schema";
import type { PayCardPreAuth, PayCardProvider } from "./types";

export type PayCardPreAuthRequest = {
  readonly provider: PayCardProvider;
};

/**
 * Pay Card authentication endpoints, injected into the shared Card API service.
 *
 * `injectEndpoints` mutates and returns the same api object, so this reference shares its reducer,
 * middleware and cache with the service the apps register, while only this one is typed with the
 * endpoint below. Reaching the backend (base URL, headers) stays in `@shared/api-services`.
 */
export const payCardAuthApi = payCardApi.injectEndpoints({
  endpoints: build => ({
    preAuth: build.mutation<PayCardPreAuth, PayCardPreAuthRequest>({
      query: body => ({
        url: "/card/v1/pre-auth",
        method: "POST",
        body,
      }),
      responseSchema: PayCardPreAuthResponseSchema,
      onSchemaFailure: error =>
        console.warn("payCardApi: pre-auth response did not match the wire contract", error.issues),
      // Without this RTK treats the failure as unhandled and reports it via `console.error`.
      catchSchemaFailure: () => ({
        status: "CUSTOM_ERROR" as const,
        error: "invalid pre-auth response",
      }),
    }),
  }),
});

export const { usePreAuthMutation } = payCardAuthApi;
