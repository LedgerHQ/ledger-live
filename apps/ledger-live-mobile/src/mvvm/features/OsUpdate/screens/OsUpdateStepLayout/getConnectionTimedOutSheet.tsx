import React from "react";
import type { OsUpdateSheetSpec } from ".";
import { OsUpdateButton } from "../../analytics/types";
import { ConnectionTimedOutContent } from "../../sheets/ConnectionTimedOutContent";

type Props = Readonly<{
  retry: () => void;
  cancel: () => void;
  trackClick: (button: OsUpdateButton) => void;
}>;

export function getConnectionTimedOutSheet({
  retry,
  cancel,
  trackClick,
}: Props): OsUpdateSheetSpec {
  const onRestart = () => {
    trackClick(OsUpdateButton.RESTART_OS_UPDATE);
    retry();
  };
  const onCancel = () => {
    trackClick(OsUpdateButton.CANCEL_OS_UPDATE);
    cancel();
  };
  return {
    hideHeader: true,
    content: <ConnectionTimedOutContent onRestart={onRestart} onCancel={onCancel} />,
  };
}
