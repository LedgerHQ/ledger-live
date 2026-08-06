import type {
  PayCardPreAuth,
  PayCardProvider,
  PayCardSession,
  PayCardUser,
} from "@domain/entity-pay-card";
import { payCardApi } from "@shared/api-services";
import {
  PayCardAuthResponseSchema,
  PayCardPreAuthResponseSchema,
  PayCardUserResponseSchema,
} from "./schema";

export type PayCardPreAuthRequest = {
  readonly provider: PayCardProvider;
};

export type PayCardAuthRequest = {
  readonly state: string;
  readonly code: string;
};

/** RTK Query cache tags for the Pay Card session. */
export const PAY_CARD_TAGS = ["PayCardSession"] as const;

/**
 * Pay Card authentication endpoints, injected into the shared Card API service.
 *
 * `enhanceEndpoints` registers this flow's own cache tags on that api and `injectEndpoints` adds the
 * endpoints — both mutate and return the same api object, so this reference shares its reducer,
 * middleware and cache with the service the apps register, while only this one is typed with the
 * endpoints below. Reaching the backend (base URL, bearer token) stays in `@shared/api-services`.
 */
export const payCardAuthApi = payCardApi
  .enhanceEndpoints({ addTagTypes: PAY_CARD_TAGS })
  .injectEndpoints({
    endpoints: build => ({
      preAuth: build.mutation<PayCardPreAuth, PayCardPreAuthRequest>({
        query: body => ({
          url: "/card/v1/pre-auth",
          method: "POST",
          body,
        }),
        transformResponse: (response: unknown) => PayCardPreAuthResponseSchema.parse(response),
      }),
      authenticate: build.mutation<PayCardSession, PayCardAuthRequest>({
        query: body => ({
          url: "/card/v1/auth",
          method: "POST",
          body,
        }),
        transformResponse: (response: unknown) => PayCardAuthResponseSchema.parse(response),
        invalidatesTags: [...PAY_CARD_TAGS],
      }),
      getMe: build.query<PayCardUser, void>({
        query: () => ({
          url: "/card/v1/me",
          method: "GET",
        }),
        transformResponse: (response: unknown) => PayCardUserResponseSchema.parse(response),
        providesTags: [...PAY_CARD_TAGS],
      }),
    }),
  });

// The `authenticate` and `getMe` hooks are added when the callback and status steps land; the
// endpoints themselves are already part of the api above.
export const { usePreAuthMutation } = payCardAuthApi;
