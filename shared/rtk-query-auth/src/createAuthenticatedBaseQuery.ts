import {
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import {
  AuthenticatedBaseQueryExtraSchema,
  type AuthenticatedBaseQueryExtraOptions,
  type KeycloakToken,
} from "./types";
import { AuthenticatedBaseQueryMissingAuthSDKError } from "./errors";

type FetchBaseQuery = BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError,
  AuthenticatedBaseQueryExtraOptions
>;

export function createAuthenticatedBaseQuery(baseQueryArgs: FetchBaseQueryArgs): FetchBaseQuery {
  return async (args, api, extraOptions) => {
    if (extraOptions?.authenticated === false) {
      return createBaseQuery(baseQueryArgs)(args, api, extraOptions);
    }

    const authSDK = checkAuthSDK(api.extra);

    const token = await authSDK.authenticate();
    const result = await createBaseQuery(baseQueryArgs, token)(args, api, extraOptions);
    if (
      typeof result.error?.status !== "number" ||
      ![401, 402, 403].includes(result.error.status)
    ) {
      return result;
    }

    const refreshedToken = await authSDK.authenticate(true);
    return createBaseQuery(baseQueryArgs, refreshedToken)(args, api, extraOptions);
  };
}

function createBaseQuery(
  { prepareHeaders, ...fetchBaseQueryArgs }: FetchBaseQueryArgs,
  token?: KeycloakToken,
): FetchBaseQuery {
  return fetchBaseQuery({
    ...fetchBaseQueryArgs,
    async prepareHeaders(headers, api) {
      const preparedHeaders = (await prepareHeaders?.(headers, api)) ?? headers;

      if (token) {
        preparedHeaders.set("authorization", `${token.tokenType} ${token.accessToken}`);
      }

      return preparedHeaders;
    },
  });
}

function checkAuthSDK(extra: unknown) {
  try {
    return AuthenticatedBaseQueryExtraSchema.parse(extra).authSDK;
  } catch {
    throw new AuthenticatedBaseQueryMissingAuthSDKError();
  }
}
