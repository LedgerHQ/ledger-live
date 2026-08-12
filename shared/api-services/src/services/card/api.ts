import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { CARD_REDUCER_PATH } from "./constants";
import { CardApiExtraSchema } from "./schema";
import type { CardApiExtra } from "./types";

/**
 * Builds this service's slice of the thunk `extraArgument`. RTK leaves `extraArgument` untyped, so
 * this is the one compile- and runtime-checked entry point: `parse` fails fast at app init if the Card
 * config is incomplete (e.g. an env var resolved to an empty string).
 */
export function cardApiExtra(extra: CardApiExtra): CardApiExtra {
  return CardApiExtraSchema.parse(extra);
}

/** Extracts the {@link CardApiExtra} from the `extraArgument` of the api. */
export function getCardExtra(api: { extra: unknown }): CardApiExtra {
  return api.extra as CardApiExtra;
}

const UNAUTHORIZED_STATUS = 401;

/**
 * Transport-only base query for the Card backend. Every request carries the current Card session token
 * as a Bearer credential; a `401` triggers a single session refresh and retry.
 *
 * Unlike the swap service this does not go through `@shared/auth` / `AuthSDK`: the token is owned by
 * the Card Auth session and injected by the app via {@link CardApiExtra}. Kept pure transport — no
 * endpoint URLs, wire schemas or mock lookups — per the api-services contract.
 */
const cardBaseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const extra = getCardExtra(api);

  const runWithToken = (token: string | null | undefined) =>
    fetchBaseQuery({
      baseUrl: extra.cardApiBaseUrl,
      prepareHeaders: headers => {
        headers.set("Content-Type", "application/json");
        if (token) {
          headers.set("authorization", `Bearer ${token}`);
        }
        return headers;
      },
    })(args, api, extraOptions);

  const result = await runWithToken(extra.getCardSessionToken());

  const isUnauthorized =
    !!result.error &&
    typeof result.error.status === "number" &&
    result.error.status === UNAUTHORIZED_STATUS;

  if (!isUnauthorized) {
    return result;
  }

  const refreshedToken = await extra.refreshCardSession();
  if (!refreshedToken) {
    return result;
  }

  return runWithToken(refreshedToken);
};

/**
 * Endpoint-less Card backend api. Register it in the store; use cases add endpoints and tags to this
 * same object — see {@link https://github.com/LedgerHQ/ledger-live/blob/develop/shared/api-services/README.md}.
 */
export const cardApi = createApi({
  reducerPath: CARD_REDUCER_PATH,
  baseQuery: cardBaseQuery,
  tagTypes: [],
  endpoints: () => ({}),
});

export type CardApi = typeof cardApi;
