import React from "react";
import { Box, IconButton } from "@ledgerhq/lumen-ui-rnative";
import { Close } from "@ledgerhq/lumen-ui-rnative/symbols";
import { ConnectNewDeviceView } from "LLM/components/ConnectNewDevice";
import { useDeviceIntentTracking } from "LLM/components/DeviceIntentExecutor/utils/DeviceIntentTrackingContext";
import {
  CONNECT_DEVICE_BUTTON,
  trackConnectDeviceButtonClicked,
} from "LLM/components/DeviceIntentExecutor/utils/trackDeviceIntent";
import { useTranslation } from "~/context/Locale";
import type { AddModeViewProps } from "./types";

export function AddModeView({
  onClose,
  ...viewProps
}: Readonly<AddModeViewProps>): React.JSX.Element {
  const { t } = useTranslation();
  const { sourceFlow, analyticsProperties } = useDeviceIntentTracking();

  const onPressClose = () => {
    trackConnectDeviceButtonClicked({
      sourceFlow,
      button: CONNECT_DEVICE_BUTTON.Close,
      extraProperties: analyticsProperties,
    });
    onClose();
  };

  return (
    <Box lx={{ flex: 1 }}>
      <Box lx={{ flexDirection: "row", justifyContent: "flex-end" }}>
        <IconButton
          appearance="no-background"
          size="md"
          icon={Close}
          accessibilityLabel={t("common.close")}
          onPress={onPressClose}
          testID="connect-known-or-new-device-add-mode-close"
        />
      </Box>
      <ConnectNewDeviceView {...viewProps} />
    </Box>
  );
}
