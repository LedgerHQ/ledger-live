import React from "react";
import { Trans } from "react-i18next";
import { getDeviceModel } from "@ledgerhq/devices";
import { Flex, Text } from "@ledgerhq/native-ui";
import { DeviceModelId } from "@ledgerhq/types-devices";

function ScanningHeader() {
  return (
    <Flex py={8} px={4} alignItems={"center"}>
      <Text variant={"h2"}>
        <Trans
          i18nKey="PairDevices.ScanningHeader.title"
          values={getDeviceModel("nanoX" as DeviceModelId)}
        />
      </Text>
      <Text variant={"body"} color={"neutral.c80"} textAlign={"center"} mt={4}>
        <Trans
          i18nKey="PairDevices.ScanningHeader.desc"
          values={getDeviceModel("nanoX" as DeviceModelId)}
        />
      </Text>
    </Flex>
  );
}

export default ScanningHeader;
