import type { Middleware } from "@reduxjs/toolkit";
import {
  mockAgentIntentRecord,
  mockAgentIntentStats,
  mockAgentProfileRecord,
} from "@domain/entity-agent-intent/schema.mock";
import { AGENT_INTENT_AUTH_PROVIDER_KEY, agentIntentApiExtra } from "@shared/api-services";
import { createAuthMiddleware } from "@shared/auth";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

export const AGENT_INTENT_BFF_URL = "https://bff.agent-intent.test";
export const AGENT_INTENTS_URL = `${AGENT_INTENT_BFF_URL}/v1/intents`;
export const AGENT_INTENT_STATS_URL = `${AGENT_INTENTS_URL}/stats`;
export const AGENT_INTENT_URL = `${AGENT_INTENTS_URL}/:intentId`;
export const AGENT_INTENT_CRAFT_URL = `${AGENT_INTENT_URL}/craft`;
export const AGENT_INTENT_SIGNATURE_URL = `${AGENT_INTENT_URL}/signature`;
export const AGENT_INTENT_REJECT_URL = `${AGENT_INTENT_URL}/reject`;
export const AGENT_PROFILES_URL = `${AGENT_INTENT_BFF_URL}/v1/agent-profiles`;
export const AGENT_PROFILE_URL = `${AGENT_PROFILES_URL}/:agentPubkey`;

export const MOCK_AGENT_INTENT_TOKEN = "agent-intent-token";

/** An error as the BFF sends it: an untyped error carries `"type": null`. */
export function agentIntentErrorResponse(
  status: number,
  message: string,
  type: string | null = null,
): Response {
  return HttpResponse.json({ message, type }, { status });
}

/** A user with one pending intent and one agent. */
export const agentIntentApiHandlers = [
  http.get(AGENT_INTENT_STATS_URL, () => HttpResponse.json(mockAgentIntentStats())),
  http.get(AGENT_INTENTS_URL, () => HttpResponse.json([mockAgentIntentRecord()])),
  http.get(AGENT_PROFILES_URL, () => HttpResponse.json([mockAgentProfileRecord()])),
];

/** MSW server for a test file; `handlers` are the defaults `resetHandlers` restores. */
export function listenToAgentIntentApi(handlers: Parameters<typeof setupServer> = []) {
  const server = setupServer(...handlers);

  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  return server;
}

export function mockAgentIntentApiExtraArgument() {
  return agentIntentApiExtra({ getAgentIntentBffUrl: () => AGENT_INTENT_BFF_URL });
}

/** The agent-intent auth middleware, answering every request with `MOCK_AGENT_INTENT_TOKEN`. */
export function mockAgentIntentAuthMiddleware(): Middleware {
  return createAuthMiddleware({
    key: AGENT_INTENT_AUTH_PROVIDER_KEY,
    createAuthProvider: () => ({
      withToken: options =>
        options.queryFn({ accessToken: MOCK_AGENT_INTENT_TOKEN, tokenType: "Bearer" }),
    }),
    isFeatureEnabled: () => true,
  });
}
