import React from "react";
import { Box, Button, Spot, Text } from "@ledgerhq/lumen-ui-rnative";
import type { LumenTextStyle, LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { Download } from "@ledgerhq/lumen-ui-rnative/symbols";
import { TrackScreen } from "~/analytics";
import {
  useRequiredFirmwareUpdateViewModel,
  type UseRequiredFirmwareUpdateViewModelProps,
  type RequiredFirmwareUpdateViewProps,
} from "./useRequiredFirmwareUpdateViewModel";

export const RequiredFirmwareUpdateView = ({
  isUsbCapable,
  title,
  description,
  ctaLabel,
  onPressCta,
}: RequiredFirmwareUpdateViewProps) => (
  <Box lx={containerStyle}>
    <TrackScreen category="Firmware Update" name="Error: App Unavailable Update Firmware" />
    <Spot appearance="icon" icon={Download} size={72} />
    <Box lx={textGroupStyle}>
      <Text typography="heading4SemiBold" lx={centeredBaseText} numberOfLines={3}>
        {title}
      </Text>
      <Text typography="body1" lx={centeredMutedText} numberOfLines={3}>
        {description}
      </Text>
    </Box>
    {isUsbCapable ? (
      <Button appearance="base" size="lg" onPress={onPressCta} lx={fullWidth}>
        {ctaLabel}
      </Button>
    ) : null}
  </Box>
);

export const RequiredFirmwareUpdate = (props: UseRequiredFirmwareUpdateViewModelProps) => (
  <RequiredFirmwareUpdateView {...useRequiredFirmwareUpdateViewModel(props)} />
);

const containerStyle: LumenViewStyle = {
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  padding: "s16",
  gap: "s24",
};

const textGroupStyle: LumenViewStyle = {
  alignItems: "center",
  gap: "s8",
};

const centeredBaseText: LumenTextStyle = { color: "base", textAlign: "center" };
const centeredMutedText: LumenTextStyle = { color: "muted", textAlign: "center" };
const fullWidth: LumenViewStyle = { width: "full" };
