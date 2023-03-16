import React from "react";
import { Trans } from "react-i18next";
import { Box, Flex, Text } from "@ledgerhq/native-ui";
import { UsbMedium } from "@ledgerhq/native-ui/assets/icons";

export default function USBEmpty({ usbOnly }: { usbOnly: boolean }) {
  return (
    <Flex alignItems={"center"} flexDirection={"row"}>
      <UsbMedium size={24} color={"neutral.c100"} />
      <Box ml={6} pr={4}>
        {!usbOnly && (
          <Text variant={"large"} fontWeight={"semiBold"}>
            <Trans i18nKey="SelectDevice.usb" />
          </Text>
        )}
        <Text variant={"body"} fontWeight={"medium"}>
          <Trans i18nKey="SelectDevice.usbLabel" />
        </Text>
      </Box>
    </Flex>
  );
}
