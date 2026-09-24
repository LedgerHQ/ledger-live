import type { AgentIntentEnvironment } from "@ledgerhq/agent-intent-sdk";

// Same values as agent-intent-frontend's per-environment BFF_BASE_URL. The SDK has no default for
// the BFF (unlike AGENT_INTENT_FRONTEND_URLS), so wallet-cli owns this table.
export const AGENT_INTENT_BFF_URLS: Record<AgentIntentEnvironment, string> = {
  staging: "https://global.api.stg.ledger-test.com/agent-intent",
  production: "https://global.api.prd.ledger.com/agent-intent",
};
