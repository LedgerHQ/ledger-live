import type { AgentIntentSource } from "@features/platform-agent-intent-entry-points";
import { ScreenName } from "~/const";

export type AgentIntentNavigatorParamList = {
  [ScreenName.AgentIntent]: { source: AgentIntentSource };
};
