import React, { useCallback } from "react";
import type { ComponentProps } from "react";
import { Clock } from "@ledgerhq/lumen-ui-react/symbols";
import { TopBarActionButton } from "./TopBarActionButton";
import { UnreadIndicator } from "LLD/components/UnreadIndicator";
import { useHistory } from "../hooks/useHistory";

export function HistoryButton() {
  const { handleHistory, historyIcon, hasUnread, tooltip, cta } = useHistory();

  const IconWithUnread = useCallback(
    (props: ComponentProps<typeof Clock>) => {
      const Icon = historyIcon;
      return (
        <span className="relative inline-flex">
          <Icon {...props} />
          <UnreadIndicator className="absolute top-0 right-0 pointer-events-none" />
        </span>
      );
    },
    [historyIcon],
  );

  return (
    <TopBarActionButton
      label="history"
      tooltip={tooltip}
      icon={hasUnread ? IconWithUnread : historyIcon}
      isInteractive={true}
      onClick={handleHistory}
      cta={cta}
    />
  );
}
