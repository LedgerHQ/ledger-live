import type { AgentIntentSource } from "@features/flow-agent-intent-entry-points";
import { AGENT_INTENT_PATH } from "./constants";

export function getAgentIntentPath(source: AgentIntentSource): string {
  return `${AGENT_INTENT_PATH}?${new URLSearchParams({ source })}`;
}
