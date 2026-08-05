import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { PAY_CARD_REDUCER_PATH } from "./constants";
import { PayCardApiExtraSchema } from "./schema";
import type { PayCardApiExtra } from "./types";

/**
 * Builds this service's slice of the thunk `extraArgument`. RTK leaves `extraArgument` untyped, so
 * this is the one compile- and runtime-checked entry point: `parse` fails fast at app init if the
 * Pay Card config is incomplete (e.g. an env var resolved to an empty string).
 */
export function payCardApiExtra(extra: PayCardApiExtra): PayCardApiExtra {
  return PayCardApiExtraSchema.parse(extra);
}

/** Extracts the {@link PayCardApiExtra} from the `extraArgument` of the api. */
export function getPayCardExtra(api: { extra: unknown }): PayCardApiExtra {
  return api.extra as PayCardApiExtra;
}

/**
 * Reads the injected {@link PayCardApiExtra} and delegates to {@link fetchBaseQuery}, attaching the
 * app session token as a bearer once the authentication flow has one.
 *
 * Not wrapped in `retry`: authentication exchanges a single-use OAuth code, which must not be
 * replayed.
 */
const payCardBaseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = (
  args,
  api,
  extraOptions,
) => {
  const parsed = PayCardApiExtraSchema.safeParse(api.extra);
  if (!parsed.success) {
    return {
      error: {
        status: "CUSTOM_ERROR" as const,
        error: "payCardApiExtra not configured in store extraArgument",
      },
    };
  }
  const extra = parsed.data;
  return fetchBaseQuery({
    baseUrl: extra.payCardApiBaseUrl,
    prepareHeaders: headers => {
      headers.set("accept", "application/json");
      const sessionToken = extra.getPayCardSessionToken?.();
      if (sessionToken) {
        headers.set("authorization", `Bearer ${sessionToken}`);
      }
      return headers;
    },
  })(args, api, extraOptions);
};

/**
 * Endpoint-less Pay Card API. Register it in the store; use cases add endpoints and tags to this
 * same object — see {@link https://github.com/LedgerHQ/ledger-live/blob/develop/shared/api-services/README.md}.
 */
export const payCardApi = createApi({
  reducerPath: PAY_CARD_REDUCER_PATH,
  baseQuery: payCardBaseQuery,
  tagTypes: [],
  endpoints: () => ({}),
});

export type PayCardApi = typeof payCardApi;
