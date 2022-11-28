import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { getDeviceModel } from "@ledgerhq/devices";
import { Device } from "@ledgerhq/live-common/hw/actions/types";

import { Flex, IconBox, Text } from "@ledgerhq/native-ui";
import { CheckAloneMedium } from "@ledgerhq/native-ui/assets/icons";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { TrackScreen } from "../../analytics";
import Button from "../../components/Button";

type Props = {
  device: Device;
  onContinue: (_: Device) => void;
  genuine: boolean;
};

export default function Paired({ device, onContinue: onContinueProps }: Props) {
  const onContinue = useCallback(() => {
    onContinueProps(device);
  }, [onContinueProps, device]);

  return (
    <Flex flexDirection={"column"} flex={1} justifyContent={"center"} mx={6}>
      <TrackScreen category="PairDevices" name="Paired" />
      <Flex alignItems={"center"}>
        <IconBox
          Icon={CheckAloneMedium}
          iconSize={24}
          boxSize={64}
          color={"success.c100"}
        />
      </Flex>
      <Text variant={"h2"} textAlign={"center"} mb={5} mt={7}>
        <Trans
          i18nKey="PairDevices.Paired.title"
          values={getDeviceModel("nanoX" as DeviceModelId)}
        />
      </Text>
      <Text
        variant={"bodyLineHeight"}
        fontWeight={"medium"}
        textAlign={"center"}
        color={"neutral.c80"}
        mb={8}
      >
        <Trans
          i18nKey="PairDevices.Paired.desc"
          values={getDeviceModel("nanoX" as DeviceModelId)}
        />
      </Text>
      <Button
        event="PairDevicesContinue"
        type="main"
        onPress={onContinue}
        width={"100%"}
      >
        <Trans i18nKey="PairDevices.Paired.action" />
      </Button>
    </Flex>
  );
}
