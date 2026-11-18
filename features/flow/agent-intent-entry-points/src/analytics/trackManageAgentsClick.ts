import { track } from "@shared/analytics";
import { AGENT_INTENT_SOURCE, AGENT_INTENT_TRACKING_ENTRY } from "../constants";

export function trackManageAgentsClick(page: string) {
  track("button_clicked", {
    button: AGENT_INTENT_TRACKING_ENTRY,
    entry: AGENT_INTENT_TRACKING_ENTRY,
    source: AGENT_INTENT_SOURCE.profile,
    page,
  });
}
