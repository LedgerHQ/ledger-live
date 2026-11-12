import { useCallback } from "react";
import { track } from "@shared/analytics";
import { AGENT_INTENT_SOURCE, AGENT_INTENT_TRACKING_ENTRY } from "../../constants";
import type { ManageAgentsCardProps } from "./ManageAgentsCard.types";
import type { ManageAgentsCardViewProps } from "./ManageAgentsCardView.types";

const DEFAULT_TEST_ID = "manage-agents-card";

export function useManageAgentsCardViewModel({
  title,
  description,
  newBadgeLabel,
  page,
  onOpen,
  testID = DEFAULT_TEST_ID,
}: ManageAgentsCardProps): ManageAgentsCardViewProps {
  const onPress = useCallback(
    function trackAndOpen() {
      track("button_clicked", {
        button: AGENT_INTENT_TRACKING_ENTRY,
        entry: AGENT_INTENT_TRACKING_ENTRY,
        source: AGENT_INTENT_SOURCE.profile,
        page,
      });
      onOpen();
    },
    [page, onOpen],
  );

  return { title, description, newBadgeLabel, onPress, testID };
}
