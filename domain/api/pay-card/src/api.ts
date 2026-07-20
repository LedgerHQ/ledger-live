import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import type {
  PayCardLogoutResult,
  PayCardPreAuth,
  PayCardSession,
  PayCardUser,
} from "@domain/entity-pay-card";
import { getPayCardApiMockHandler } from "./mocks";
import {
  transformPayCardAuthResponse,
  transformPayCardLogoutResponse,
  transformPayCardPreAuthResponse,
  transformPayCardUserResponse,
} from "./transforms";
import {
  PayCardApiTags,
  type PayCardAuthRequest,
  type PayCardPreAuthRequest,
} from "./types";

const DEFAULT_MOCK_DELAY_MS = 500;
const AUTHENTICATED_ENDPOINTS = new Set(["getMe", "logout"]);

export type PayCardApiExtra = {
  readonly payCardApiBaseUrl: string;
  readonly payCardApiMocksEnabled: boolean;
  readonly payCardApiMockDelayMs: number;
  readonly getPayCardSessionToken: () => string | null | undefined;
};

/**
 * Builds this package's slice of the thunk `extraArgument`.
 * When mocks are off, an empty base URL fails fast at app init (same idea as
 * other domain/api `*ApiExtra` helpers). Mocks-only config remains allowed.
 */
export function payCardApiExtra(
  overrides: Partial<PayCardApiExtra> = {},
): PayCardApiExtra {
  const payCardApiBaseUrl = overrides.payCardApiBaseUrl ?? "";
  const payCardApiMocksEnabled = overrides.payCardApiMocksEnabled ?? false;

  if (!payCardApiMocksEnabled && !payCardApiBaseUrl) {
    throw new Error(
      "payCardApiBaseUrl is required when payCardApiMocksEnabled is false",
    );
  }

  return {
    payCardApiBaseUrl,
    payCardApiMocksEnabled,
    payCardApiMockDelayMs: Math.max(
      0,
      overrides.payCardApiMockDelayMs ?? DEFAULT_MOCK_DELAY_MS,
    ),
    getPayCardSessionToken: overrides.getPayCardSessionToken ?? (() => undefined),
  };
}

function resolvePayCardApiExtra(extra: unknown): PayCardApiExtra {
  if (typeof extra !== "object" || extra === null) {
    return payCardApiExtra();
  }

  return payCardApiExtra(extra as Partial<PayCardApiExtra>);
}

function toFetchArgs(args: string | FetchArgs): FetchArgs {
  return typeof args === "string" ? { url: args } : args;
}

function wait(delayMs: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, delayMs));
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown Pay Card API error";
}

export const payCardBaseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const config = resolvePayCardApiExtra(api.extra);
  const request = toFetchArgs(args);
  const mockHandler = config.payCardApiMocksEnabled
    ? getPayCardApiMockHandler(request)
    : undefined;

  if (mockHandler) {
    try {
      await wait(config.payCardApiMockDelayMs);
      return { data: mockHandler(request) };
    } catch (error) {
      return {
        error: {
          status: "CUSTOM_ERROR",
          error: getErrorMessage(error),
        },
      };
    }
  }

  if (config.payCardApiMocksEnabled) {
    return {
      error: {
        status: "CUSTOM_ERROR",
        error: `No Pay Card API mock handler for ${request.method ?? "GET"} ${request.url}`,
      },
    };
  }

  if (!config.payCardApiBaseUrl) {
    return {
      error: {
        status: "CUSTOM_ERROR",
        error: "payCardApiBaseUrl is empty — Pay Card API is not configured",
      },
    };
  }

  const realBaseQuery = fetchBaseQuery({
    baseUrl: config.payCardApiBaseUrl,
    prepareHeaders: headers => {
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
    preAuth: build.mutation<PayCardPreAuth, PayCardPreAuthRequest | void>({
      query: body => ({
        url: "/card/v1/pre-auth",
        method: "POST",
        body: body ?? {},
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
    logout: build.mutation<PayCardLogoutResult, void>({
      query: () => ({
        url: "/card/v1/logout",
        method: "POST",
      }),
      transformResponse: transformPayCardLogoutResponse,
      invalidatesTags: [PayCardApiTags.Session],
    }),
  }),
});

export const {
  usePreAuthMutation,
  useAuthenticateMutation,
  useGetMeQuery,
  useLogoutMutation,
} = payCardApi;

export type PayCardApi = typeof payCardApi;
