import { AGENT_INTENT_SOURCE } from "../constants";
import type { AgentIntentFlag } from "../internals";
import type { AgentIntentSource } from "../types";

export function getAgentIntentAttributes(flag: AgentIntentFlag) {
  const isEnabled = flag?.enabled ?? false;
  const entryPoints: AgentIntentSource[] = [];

  if (isEnabled && flag?.params?.navBar) entryPoints.push(AGENT_INTENT_SOURCE.navBar);
  if (isEnabled && flag?.params?.profile) entryPoints.push(AGENT_INTENT_SOURCE.profile);

  return { isEnabled, entryPoints };
}
