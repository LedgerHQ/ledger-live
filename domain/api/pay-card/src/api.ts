import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import type { PayCardPreAuth, PayCardSession, PayCardUser } from "@domain/entity-pay-card";
import {
  transformPayCardAuthResponse,
  transformPayCardPreAuthResponse,
  transformPayCardUserResponse,
} from "./transforms";
import { PayCardApiTags, type PayCardAuthRequest, type PayCardPreAuthRequest } from "./types";

const AUTHENTICATED_ENDPOINTS = new Set(["getMe"]);

export type PayCardApiExtra = {
  readonly payCardApiBaseUrl: string;
  readonly getPayCardSessionToken: () => string | null | undefined;
};

type PayCardApiExtraInput = {
  readonly payCardApiBaseUrl: string;
  readonly getPayCardSessionToken?: () => string | null | undefined;
};

/**
 * Builds this package's slice of the thunk `extraArgument`.
 * An empty base URL fails fast at app init, same idea as other domain/api
 * `*ApiExtra` helpers.
 */
export function payCardApiExtra(overrides: PayCardApiExtraInput): PayCardApiExtra {
  const payCardApiBaseUrl =
    typeof overrides.payCardApiBaseUrl === "string" ? overrides.payCardApiBaseUrl.trim() : "";

  if (!payCardApiBaseUrl) {
    throw new Error("payCardApiBaseUrl is required");
  }

  return {
    payCardApiBaseUrl,
    getPayCardSessionToken: overrides.getPayCardSessionToken ?? (() => undefined),
  };
}

function resolvePayCardApiExtra(extra: unknown): PayCardApiExtra {
  if (typeof extra !== "object" || extra === null) {
    throw new Error("payCardApiExtra is required in thunk extraArgument");
  }

  return payCardApiExtra(extra as PayCardApiExtraInput);
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown Pay Card API error";
}

export const payCardBaseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let config: PayCardApiExtra;
  try {
    config = resolvePayCardApiExtra(api.extra);
  } catch (error) {
    return {
      error: {
        status: "CUSTOM_ERROR",
        error: getErrorMessage(error),
      },
    };
  }

  const realBaseQuery = fetchBaseQuery({
    baseUrl: config.payCardApiBaseUrl,
    prepareHeaders: headers => {
      headers.set("accept", "application/json");

      if (AUTHENTICATED_ENDPOINTS.has(api.endpoint)) {
        const sessionToken = config.getPayCardSessionToken();
        if (sessionToken) {
          headers.set("authorization", `Bearer ${sessionToken}`);
        }
      }
      return headers;
    },
  });

  try {
    return await realBaseQuery(args, api, extraOptions);
  } catch (error) {
    return {
      error: {
        status: "FETCH_ERROR",
        error: getErrorMessage(error),
      },
    };
  }
};

export const payCardApi = createApi({
  reducerPath: "payCardApi",
  baseQuery: payCardBaseQuery,
  tagTypes: [PayCardApiTags.Session],
  endpoints: build => ({
    preAuth: build.mutation<PayCardPreAuth, PayCardPreAuthRequest>({
      query: body => ({
        url: "/card/v1/pre-auth",
        method: "POST",
        body,
      }),
      transformResponse: transformPayCardPreAuthResponse,
    }),
    authenticate: build.mutation<PayCardSession, PayCardAuthRequest>({
      query: body => ({
        url: "/card/v1/auth",
        method: "POST",
        body,
      }),
      transformResponse: transformPayCardAuthResponse,
      invalidatesTags: [PayCardApiTags.Session],
    }),
    getMe: build.query<PayCardUser, void>({
      query: () => ({
        url: "/card/v1/me",
        method: "GET",
      }),
      transformResponse: transformPayCardUserResponse,
      providesTags: [PayCardApiTags.Session],
    }),
  }),
});

export const { usePreAuthMutation, useAuthenticateMutation, useGetMeQuery } = payCardApi;

export type PayCardApi = typeof payCardApi;
