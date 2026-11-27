import {
  AGENT_DESCRIPTION_MAX_LENGTH,
  AGENT_INTENT_STATUSES,
  AGENT_NAME_MAX_LENGTH,
  isActionableIntentStatus,
} from "./internals/agentIntentSdk";
import type { AgentIntentStatus } from "./types";

export const AGENT_INTENT_PENDING_STATUSES: readonly AgentIntentStatus[] =
  AGENT_INTENT_STATUSES.filter(isActionableIntentStatus);

export const AGENT_INTENT_HISTORY_STATUSES: readonly AgentIntentStatus[] =
  AGENT_INTENT_STATUSES.filter(status => !isActionableIntentStatus(status));

export const AGENT_PROFILE_NAME_MAX_LENGTH = AGENT_NAME_MAX_LENGTH;
export const AGENT_PROFILE_DESCRIPTION_MAX_LENGTH = AGENT_DESCRIPTION_MAX_LENGTH;
export const AGENT_PROFILE_SOURCE_MAX_LENGTH = 32;
