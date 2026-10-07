import React from "react";
import {
  Box,
  Button,
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
  Spot,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import type { ConnectNewDeviceUIStateTypes, SelectableDevice } from "@ledgerhq/live-dmk-mobile";
import { getDeviceSymbolByModelId } from "LLM/utils/getDeviceIcon";
import { useTranslation } from "~/context/Locale";
import type { ConnectNewDeviceNonErrorUIState } from "../types";

type DiscoveringViewProps = {
  state: Extract<
    ConnectNewDeviceNonErrorUIState,
    { type: typeof ConnectNewDeviceUIStateTypes.Discovering }
  >;
  onDeviceNotFound: () => void;
};

// Placeholder: the final design comes with LIVE-38357.
export function DiscoveringView({
  state,
  onDeviceNotFound,
}: Readonly<DiscoveringViewProps>): React.ReactNode {
  const { t } = useTranslation();

  return (
    <Box lx={{ width: "full", gap: "s16", paddingHorizontal: "s8" }}>
      <Text typography="heading4SemiBold" lx={{ color: "base" }}>
        {t("connectNewDevice.discovering.title")}
      </Text>
      <Box>
        {state.devices.map(({ device, onSelect }: SelectableDevice) => (
          <ListItem key={`${device.transport}:${device.id}`} onPress={onSelect}>
            <ListItemLeading>
              <Spot
                size={48}
                appearance="icon"
                icon={getDeviceSymbolByModelId(device.deviceModelId)}
              />
              <ListItemContent>
                <ListItemTitle typography="body2SemiBold">
                  {device.name ?? t("deviceIntentExecutor.connectDevice.common.ledgerDevice")}
                </ListItemTitle>
              </ListItemContent>
            </ListItemLeading>
          </ListItem>
        ))}
      </Box>
      {state.showDeviceNotFound ? (
        <Button appearance="gray" size="lg" isFull onPress={onDeviceNotFound}>
          {t("connectNewDevice.discovering.deviceNotFound")}
        </Button>
      ) : null}
    </Box>
  );
}
