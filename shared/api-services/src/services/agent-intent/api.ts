import {
  createApi,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { createAuthenticatedBaseQuery } from "@shared/auth";
import { AGENT_INTENT_REDUCER_PATH } from "./constants";
import { AgentIntentApiExtraSchema } from "./schema";
import type { AgentIntentApiExtra } from "./types";

/** The key of the auth provider for realm `agent-intent-customers`. */
export const AGENT_INTENT_AUTH_PROVIDER_KEY = "agent-intent";

export function agentIntentApiExtra(extra: AgentIntentApiExtra): AgentIntentApiExtra {
  return AgentIntentApiExtraSchema.parse(extra);
}

/** Not wrapped in `retry`: signing, rejecting and profile writes are not idempotent. */
const agentIntentBaseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = (
  args,
  api,
  extraOptions,
) => {
  const parsed = AgentIntentApiExtraSchema.safeParse(api.extra);
  if (!parsed.success) {
    return {
      error: {
        status: "CUSTOM_ERROR",
        error: "agentIntentApiExtra not configured in store extraArgument",
      },
    };
  }

  // An empty baseUrl would otherwise resolve `fetch` against the app's own origin instead of failing.
  const baseUrl = parsed.data.getAgentIntentBffUrl();
  if (!baseUrl) {
    return {
      error: { status: "CUSTOM_ERROR", error: "getAgentIntentBffUrl() resolved to an empty value" },
    };
  }

  return createAuthenticatedBaseQuery(
    { baseUrl },
    { authProviderKey: AGENT_INTENT_AUTH_PROVIDER_KEY },
  )(args, api, extraOptions);
};

/**
 * Endpoint-less Agent Intent BFF api. Register it in the store; use cases add endpoints and tags to
 * this same object — see {@link https://github.com/LedgerHQ/ledger-live/blob/develop/shared/api-services/README.md}.
 */
export const agentIntentApi = createApi({
  reducerPath: AGENT_INTENT_REDUCER_PATH,
  baseQuery: agentIntentBaseQuery,
  tagTypes: [],
  endpoints: () => ({}),
});

export type AgentIntentApi = typeof agentIntentApi;
