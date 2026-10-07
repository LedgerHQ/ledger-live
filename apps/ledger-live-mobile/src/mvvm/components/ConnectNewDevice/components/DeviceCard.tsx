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

export function DeviceCard(props: Readonly<SelectableDevice>): React.ReactNode {
  const { device, isAvailable } = props;
  const onSelect = props.isAvailable ? props.onSelect : undefined;
  const { t } = useTranslation();
  const deviceName = device.name ?? t("deviceIntentExecutor.connectDevice.common.ledgerDevice");

  return (
    <Card type="info" disabled={!isAvailable}>
      <CardHeader>
        <CardLeading>
          <Spot
            appearance="icon"
            icon={getDeviceSymbolByModelId(device.deviceModelId)}
            disabled={!isAvailable}
          />
          <CardContent>
            <CardContentTitle>{deviceName}</CardContentTitle>
          </CardContent>
        </CardLeading>
        <CardTrailing>
          <Button
            appearance="base"
            size="sm"
            disabled={!isAvailable}
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
