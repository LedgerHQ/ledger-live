import React from "react";
import { InfoState } from "@shared/ui-info-state";
import { Trans } from "~/context/Locale";

type BatteryTooLowContentProps = Readonly<{
  productName: string;
  percentage: number;
  onCancel: () => void;
}>;

export function BatteryTooLowContent({
  productName,
  percentage,
  onCancel,
}: BatteryTooLowContentProps) {
  return (
    <InfoState
      preset="info"
      size="hug"
      title={<Trans i18nKey="osUpdates.batteryTooLow.title" values={{ productName }} />}
      description={<Trans i18nKey="osUpdates.batteryTooLow.description" values={{ percentage }} />}
      primaryCta={{
        label: <Trans i18nKey="osUpdates.actions.cancel" />,
        onPress: onCancel,
      }}
      testID="os-update-battery-too-low"
    />
  );
}
