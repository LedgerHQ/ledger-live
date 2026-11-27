import type { ApiServiceDescriptor } from "../../compose";
import { agentIntentApi, agentIntentApiExtra, type AgentIntentApi } from "./api";
import type { AgentIntentApiExtra } from "./types";

export function agentIntentService(
  own: () => AgentIntentApiExtra,
): ApiServiceDescriptor<AgentIntentApi> {
  return { api: agentIntentApi, buildExtra: () => agentIntentApiExtra(own()) };
}
