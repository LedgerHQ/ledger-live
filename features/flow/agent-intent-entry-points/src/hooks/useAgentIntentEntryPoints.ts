import { useFeature } from "@features/platform-feature-flags";
import type { AgentIntentEntryPoints } from "../types";

export function useAgentIntentEntryPoints(): AgentIntentEntryPoints {
  const feature = useFeature("agentIntent");
  const isEnabled = feature?.enabled ?? false;

  return {
    isNavBarEnabled: isEnabled && (feature?.params?.navBar ?? false),
    isProfileEnabled: isEnabled && (feature?.params?.profile ?? false),
  };
}
