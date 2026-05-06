import React from "react";
import { Box, Tag, Text, useTheme } from "@ledgerhq/lumen-ui-rnative";
import {
  ConnectDeviceUIStateTypes,
  type ConnectDeviceUIState,
} from "@ledgerhq/live-dmk-mobile";
import { getProductName } from "LLM/utils/getProductName";
import Animation from "~/components/Animation";
import { useTranslation } from "~/context/Locale";
import { getDeviceAnimation } from "~/helpers/getDeviceAnimation";

type WaitingForSelectedDeviceStateProps = {
  state: Extract<
    ConnectDeviceUIState,
    { type: ConnectDeviceUIStateTypes.WaitingForSelectedDevice }
  >;
};

function getDeviceName(
  device: WaitingForSelectedDeviceStateProps["state"]["device"],
  fallbackName: string,
): string {
  return device.name ?? fallbackName;
}

export function WaitingForSelectedDeviceState({
  state,
}: WaitingForSelectedDeviceStateProps): React.ReactNode {
  const { t } = useTranslation();
  const productName = getProductName(state.device.deviceModelId);
  const theme = useTheme();

  return (
    <Box lx={{ width: "full", alignItems: "center" }}>
      <Box lx={{ alignItems: "center" }}>
        <Box style={{ alignItems: "center", justifyContent: "center" }}>
          <Animation
            source={getDeviceAnimation({
              theme: theme.colorScheme === "dark" ? "dark" : "light",
              modelId: state.device.deviceModelId,
              key: "plugAndPinCode",
            })}
          />
        </Box>
        <Tag
          appearance="gray"
          label={getDeviceName(
            state.device,
            t("deviceIntentExecutor.connectDevice.common.ledgerDevice"),
          )}
          size="md"
        />
      </Box>
      <Text
        typography="heading4SemiBold"
        lx={{ color: "base", textAlign: "center", paddingTop: "s32" }}
      >
        {t("deviceIntentExecutor.connectDevice.states.waitingForSelectedDevice.title", {
          productName,
        })}
      </Text>
    </Box>
  );
}
