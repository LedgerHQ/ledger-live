import React from "react";
import { Box, Tag } from "@ledgerhq/lumen-ui-rnative";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import { InfoState } from "@shared/ui-info-state";
import { Trans, useTranslation } from "~/context/Locale";
import { getDeviceSymbolByModelId } from "LLM/utils/getDeviceIcon";
import { BatteryLowIcon } from "./BatteryLowIcon";

type BatteryTooLowContentProps = Readonly<{
  deviceModelId: DeviceModelId;
  productName: string;
  percentage: number;
  onCancel: () => void;
}>;

export function BatteryTooLowContent({
  deviceModelId,
  productName,
  percentage,
  onCancel,
}: BatteryTooLowContentProps) {
  const { t } = useTranslation();

  return (
    <InfoState
      preset="spot"
      spotProps={{ icon: BatteryLowIcon }}
      size="hug"
      title={<Trans i18nKey="osUpdates.batteryTooLow.title" values={{ productName }} />}
      description={<Trans i18nKey="osUpdates.batteryTooLow.description" values={{ productName }} />}
      content={
        <Box lx={{ alignItems: "center" }}>
          <Tag
            appearance="gray"
            size="md"
            icon={getDeviceSymbolByModelId(deviceModelId)}
            label={t("osUpdates.batteryTooLow.batteryLevel", { percentage })}
            testID="os-update-battery-level"
          />
        </Box>
      }
      secondaryCta={{
        label: <Trans i18nKey="osUpdates.batteryTooLow.cancel" />,
        onPress: onCancel,
      }}
      testID="os-update-battery-too-low"
    />
  );
}
