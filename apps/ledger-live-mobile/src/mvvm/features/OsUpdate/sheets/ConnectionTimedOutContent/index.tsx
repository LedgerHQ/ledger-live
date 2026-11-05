import React from "react";
import { InfoState } from "@shared/ui-info-state";
import { Trans } from "~/context/Locale";

type ConnectionTimedOutContentProps = Readonly<{
  onRestart: () => void;
  onSendReport: () => void;
}>;

export function ConnectionTimedOutContent({
  onRestart,
  onSendReport,
}: ConnectionTimedOutContentProps) {
  return (
    <InfoState
      preset="info"
      size="hug"
      title={<Trans i18nKey="osUpdates.connectionTimedOut.title" />}
      description={<Trans i18nKey="osUpdates.connectionTimedOut.description" />}
      primaryCta={{
        label: <Trans i18nKey="osUpdates.connectionTimedOut.restart" />,
        onPress: onRestart,
      }}
      secondaryCta={{
        label: <Trans i18nKey="osUpdates.connectionTimedOut.sendReport" />,
        onPress: onSendReport,
      }}
      testID="os-update-connection-timed-out"
    />
  );
}
