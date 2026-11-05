import React from "react";
import type { OsUpdateSheetSpec } from ".";
import { OsUpdateButton } from "../../analytics/types";
import { ConnectionTimedOutContent } from "../../sheets/ConnectionTimedOutContent";

type Props = Readonly<{
  retry: () => void;
  trackClick: (button: OsUpdateButton) => void;
  exportLogs: () => void;
}>;

export function getConnectionTimedOutSheet({
  retry,
  trackClick,
  exportLogs,
}: Props): OsUpdateSheetSpec {
  const onRestart = () => {
    trackClick(OsUpdateButton.RETRY);
    retry();
  };
  const onSendReport = () => {
    trackClick(OsUpdateButton.SEND_REPORT);
    exportLogs();
  };
  return {
    hideHeader: true,
    content: <ConnectionTimedOutContent onRestart={onRestart} onSendReport={onSendReport} />,
  };
}
