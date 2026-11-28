import type { AgentIntentSource } from "./types";

export const AGENT_INTENT_TRACKING_ENTRY = "agent_intent";

export const AGENT_INTENT_SOURCE = {
  navBar: "nav_bar",
  profile: "profile",
} as const satisfies Record<string, AgentIntentSource>;
