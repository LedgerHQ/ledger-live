import React from "react";
import { DotIndicator } from "@ledgerhq/lumen-ui-react";
import { TopBarActionButton } from "./TopBarActionButton";
import { useHistory } from "../hooks/useHistory";

export function HistoryButton() {
  const { handleHistory, historyIcon, hasUnread, tooltip, cta } = useHistory();

  const button = (
    <TopBarActionButton
      label="history"
      tooltip={tooltip}
      icon={historyIcon}
      isInteractive={true}
      onClick={handleHistory}
      cta={cta}
    />
  );

  return hasUnread ? (
    <DotIndicator appearance="red" size="xs" data-testid="unread-indicator">
      {button}
    </DotIndicator>
  ) : (
    button
  );
}
