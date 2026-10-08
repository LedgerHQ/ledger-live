import React from "react";
import {
  Button,
  Card,
  CardContent,
  CardContentTitle,
  CardHeader,
  CardLeading,
  CardTrailing,
  Spot,
} from "@ledgerhq/lumen-ui-rnative";
import type { SelectableDevice } from "@ledgerhq/live-dmk-mobile";
import { getDeviceSymbolByModelId } from "LLM/utils/getDeviceIcon";
import { useTranslation } from "~/context/Locale";

export function DeviceCard({ device, onSelect }: Readonly<SelectableDevice>): React.ReactNode {
  const { t } = useTranslation();
  const deviceName = device.name ?? t("deviceIntentExecutor.connectDevice.common.ledgerDevice");

  return (
    <Card type="info">
      <CardHeader>
        <CardLeading>
          <Spot appearance="icon" icon={getDeviceSymbolByModelId(device.deviceModelId)} />
          <CardContent>
            <CardContentTitle>{deviceName}</CardContentTitle>
          </CardContent>
        </CardLeading>
        <CardTrailing>
          <Button
            appearance="base"
            size="sm"
            onPress={onSelect}
            // For screen readers: the visible label does not say which device the button selects.
            accessibilityLabel={t("connectNewDevice.discovering.selectAccessibilityLabel", {
              deviceName,
            })}
          >
            {t("connectNewDevice.discovering.select")}
          </Button>
        </CardTrailing>
      </CardHeader>
    </Card>
  );
}
