import React from "react";
import { Text, Flex, Button } from "@ledgerhq/native-ui";
import { useUpdateFirmware } from "@ledgerhq/live-common/deviceSDK/hooks/useUpdateFirmware";
import NavigationScrollView from "../../../../components/NavigationScrollView";

export default function DebugFirmwareUpdate() {
  // TODO: add device selection to correctly get the device id
  const { updateState, triggerUpdate } = useUpdateFirmware({
    deviceId:
      'usb|{"vendorId":11415,"productId":24593,"deviceName":"/dev/bus/usb/002/005","deviceId":2005,"name":"/dev/bus/usb/002/005"}',
  });
  return (
    <NavigationScrollView>
      <Flex flex={1} p={16}>
        <Text>Yolo</Text>
        <Button type="main" my={4} onPress={() => triggerUpdate()}>Trigger Update</Button>
        <Text variant="h1">Update State:</Text>
        <Text variant="paragraph">{JSON.stringify(updateState)}</Text>
      </Flex>
    </NavigationScrollView>
  );
}
