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

/**
 * Reads the injected {@link PayCardApiExtra} and delegates to {@link fetchBaseQuery}.
 *
 * Not wrapped in `retry`: the OAuth code exchange that lands on this service next is single-use and
 * must not be replayed.
 */
const payCardBaseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = (
  args,
  api,
  extraOptions,
) => {
  // `safeParse` rather than the cast the sibling services use: it turns a misconfigured store into a
  // handled error instead of a request against an undefined base URL.
  const parsed = PayCardApiExtraSchema.safeParse(api.extra);
  if (!parsed.success) {
    return {
      error: {
        status: "CUSTOM_ERROR" as const,
        error: "payCardApiExtra not configured in store extraArgument",
      },
    };
  }
  return fetchBaseQuery({
    baseUrl: parsed.data.payCardApiBaseUrl,
    prepareHeaders: headers => {
      headers.set("accept", "application/json");
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
