import {
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import { AuthProviderMissingError } from "./errors";
import {
  AuthenticatedBaseQueryExtraSchema,
  type AuthenticatedBaseQueryExtraOptions,
} from "./types";

type FetchBaseQuery = BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError,
  AuthenticatedBaseQueryExtraOptions
>;

const UNAUTHORIZED_STATUSES = new Set([401, 403]);

export function createAuthenticatedBaseQuery(baseQueryArgs: FetchBaseQueryArgs): FetchBaseQuery {
  return async (args, api, extraOptions) => {
    if (extraOptions?.authenticated !== false) {
      try {
        return await getAuthProvider(api.extra).withToken({
          async queryFn(token) {
            if (!token) {
              return fetchBaseQuery(baseQueryArgs)(args, api, extraOptions);
            }
            return fetchBaseQuery({
              ...baseQueryArgs,
              async prepareHeaders(headers, baseQueryApi) {
                const preparedHeaders =
                  (await baseQueryArgs.prepareHeaders?.(headers, baseQueryApi)) ?? headers;
                preparedHeaders.set("authorization", `${token.tokenType} ${token.accessToken}`);
                return preparedHeaders;
              },
            })(args, api, extraOptions);
          },

          refreshAndRetryWhen(result) {
            if (extraOptions?.refreshAndRetryWhen) {
              try {
                return extraOptions.refreshAndRetryWhen(result);
              } catch (error) {
                console?.error("AuthenticatedBaseQuery retry predicate failed:", error);
                return false;
              }
            }
            return (
              !!result.error &&
              typeof result.error?.status === "number" &&
              UNAUTHORIZED_STATUSES.has(result.error.status)
            );
          },
        });
      } catch (error) {
        // Authentication failed; fall back to an unauthenticated request.
        console?.warn("AuthenticatedBaseQuery failed to authenticate:", error);
      }
    }

    return fetchBaseQuery(baseQueryArgs)(args, api, extraOptions);
  };
}

function getAuthProvider(extra: unknown) {
  try {
    return AuthenticatedBaseQueryExtraSchema.parse(extra).authProvider;
  } catch {
    throw new AuthProviderMissingError();
  }
}
