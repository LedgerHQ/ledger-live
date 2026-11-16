import React from "react";
import { WarningFill } from "@ledgerhq/lumen-ui-rnative/symbols";
import { InfoState } from "@shared/ui-info-state";
import { Trans } from "@shared/i18n";

type SecureConnectionRefusedContentProps = Readonly<{
  productName: string;
  onRetry: () => void;
  onCancel: () => void;
}>;

export function SecureConnectionRefusedContent({
  productName,
  onRetry,
  onCancel,
}: SecureConnectionRefusedContentProps) {
  return (
    <InfoState
      preset="spot"
      spotProps={{ icon: WarningFill, appearance: "warning" }}
      size="hug"
      title={<Trans i18nKey="osUpdates.secureConnectionRefused.title" />}
      description={
        <Trans i18nKey="osUpdates.secureConnectionRefused.description" values={{ productName }} />
      }
      primaryCta={{
        label: <Trans i18nKey="osUpdates.secureConnectionRefused.retry" />,
        onPress: onRetry,
      }}
      secondaryCta={{
        label: <Trans i18nKey="osUpdates.secureConnectionRefused.cancel" />,
        onPress: onCancel,
      }}
      testID="os-update-secure-connection-refused"
    />
  );
}
