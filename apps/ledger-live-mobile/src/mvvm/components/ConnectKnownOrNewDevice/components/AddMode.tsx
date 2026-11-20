import React from "react";
import { Box, IconButton } from "@ledgerhq/lumen-ui-rnative";
import { Close } from "@ledgerhq/lumen-ui-rnative/symbols";
import {
  ConnectNewDeviceView,
  type ConnectNewDeviceViewProps,
} from "LLM/components/ConnectNewDevice";
import { useTranslation } from "~/context/Locale";

type AddModeProps = ConnectNewDeviceViewProps & {
  onClose: () => void;
};

export function AddMode({ onClose, ...viewProps }: Readonly<AddModeProps>): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <Box lx={{ flex: 1 }}>
      <Box lx={{ flexDirection: "row", justifyContent: "flex-end" }}>
        <IconButton
          appearance="no-background"
          size="md"
          icon={Close}
          accessibilityLabel={t("common.close")}
          onPress={onClose}
          testID="connect-known-or-new-device-add-mode-close"
        />
      </Box>
      <ConnectNewDeviceView {...viewProps} />
    </Box>
  );
}
