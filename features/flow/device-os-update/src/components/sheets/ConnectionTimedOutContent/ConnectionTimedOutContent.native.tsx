import React from "react";
import { WarningFill } from "@ledgerhq/lumen-ui-rnative/symbols";
import { InfoState } from "@shared/ui-info-state";
import { Trans } from "@shared/i18n";

type ConnectionTimedOutContentProps = Readonly<{
  onRestart: () => void;
  onCancel: () => void;
}>;

export function ConnectionTimedOutContent({ onRestart, onCancel }: ConnectionTimedOutContentProps) {
  return (
    <InfoState
      preset="spot"
      spotProps={{ icon: WarningFill, appearance: "warning" }}
      size="hug"
      title={<Trans i18nKey="osUpdates.connectionTimedOut.title" />}
      description={<Trans i18nKey="osUpdates.connectionTimedOut.description" />}
      primaryCta={{
        label: <Trans i18nKey="osUpdates.connectionTimedOut.restart" />,
        onPress: onRestart,
      }}
      secondaryCta={{
        label: <Trans i18nKey="osUpdates.actions.cancelOsUpdate" />,
        onPress: onCancel,
      }}
      testID="os-update-connection-timed-out"
    />
  );
}
