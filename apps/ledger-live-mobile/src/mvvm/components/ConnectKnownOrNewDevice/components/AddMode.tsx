import React from "react";
import { Box, IconButton } from "@ledgerhq/lumen-ui-rnative";
import { Close } from "@ledgerhq/lumen-ui-rnative/symbols";
import {
  ConnectNewDeviceView,
  type ConnectNewDeviceViewProps,
} from "LLM/components/ConnectNewDevice";
import { useDeviceIntentTracking } from "LLM/components/DeviceIntentExecutor/utils/DeviceIntentTrackingContext";
import { trackDeviceflowCanceled } from "LLM/components/DeviceIntentExecutor/utils/trackDeviceIntent";
import { useTranslation } from "~/context/Locale";

type AddModeProps = ConnectNewDeviceViewProps & {
  onClose: () => void;
};

export function AddMode({ onClose, ...viewProps }: Readonly<AddModeProps>): React.JSX.Element {
  const { t } = useTranslation();
  const { sourceFlow, analyticsProperties } = useDeviceIntentTracking();

  // The embedded flow sends no outcome: the device list sends it.
  const onPressClose = () => {
    trackDeviceflowCanceled({ sourceFlow, extraProperties: analyticsProperties, failure: null });
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
      <ConnectNewDeviceView {...viewProps} isEmbedded />
    </Box>
  );
}
