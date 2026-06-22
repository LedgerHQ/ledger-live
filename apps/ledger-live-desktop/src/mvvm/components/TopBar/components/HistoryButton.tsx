import React from "react";
import { DotIndicator } from "@ledgerhq/lumen-ui-react";
import { TopBarActionButton } from "./TopBarActionButton";
import { useHistory } from "../hooks/useHistory";

export function HistoryButton() {
  const { handleHistory, historyIcon, hasUnread, cta } = useHistory();

  const button = (
    <TopBarActionButton
      label="history"
      icon={historyIcon}
      isInteractive={true}
      onClick={handleHistory}
      cta={cta}
    />
  );

  return hasUnread ? (
    <DotIndicator appearance="base" size="lg" data-testid="unread-indicator">
      {button}
    </DotIndicator>
  ) : (
    button
  );
}
