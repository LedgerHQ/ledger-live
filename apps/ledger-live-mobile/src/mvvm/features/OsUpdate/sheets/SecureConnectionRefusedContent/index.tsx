import React from "react";
import { getDeviceModel } from "@ledgerhq/devices";
import { WarningFill } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import { InfoState } from "@shared/ui-info-state";
import { Trans } from "~/context/Locale";

type SecureConnectionRefusedContentProps = Readonly<{
  deviceModelId: DeviceModelId;
  onRetry: () => void;
  onCancel: () => void;
}>;

export function SecureConnectionRefusedContent({
  deviceModelId,
  onRetry,
  onCancel,
}: SecureConnectionRefusedContentProps) {
  const { productName } = getDeviceModel(deviceModelId);

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
