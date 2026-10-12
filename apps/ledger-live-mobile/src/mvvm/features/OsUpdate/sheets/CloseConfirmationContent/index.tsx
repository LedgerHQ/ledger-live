import React from "react";
import { Warning } from "@ledgerhq/lumen-ui-rnative/symbols";
import { InfoState } from "@shared/ui-info-state";
import { Trans } from "~/context/Locale";

type CloseConfirmationContentProps = Readonly<{
  onContinue: () => void;
  onCancel: () => void;
}>;

export function CloseConfirmationContent({ onContinue, onCancel }: CloseConfirmationContentProps) {
  return (
    <InfoState
      preset="spot"
      spotProps={{ icon: Warning }}
      size="hug"
      title={<Trans i18nKey="osUpdates.closeConfirmation.title" />}
      description={<Trans i18nKey="osUpdates.closeConfirmation.description" />}
      primaryCta={{
        label: <Trans i18nKey="osUpdates.closeConfirmation.continue" />,
        onPress: onContinue,
        testID: "os-update-close-confirmation-continue",
      }}
      secondaryCta={{
        label: <Trans i18nKey="osUpdates.closeConfirmation.cancel" />,
        onPress: onCancel,
        testID: "os-update-close-confirmation-cancel",
      }}
      testID="os-update-close-confirmation"
    />
  );
}
