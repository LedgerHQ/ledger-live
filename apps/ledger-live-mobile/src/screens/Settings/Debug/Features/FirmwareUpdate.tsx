import React, { useState } from "react";
import { Text, Flex, Button } from "@ledgerhq/native-ui";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useUpdateFirmware } from "@ledgerhq/live-common/deviceSDK/hooks/useUpdateFirmware";
import NavigationScrollView from "../../../../components/NavigationScrollView";
import SelectDevice from "../../../../components/SelectDevice2";

export default function DebugFirmwareUpdate() {
  const [device, setDevice] = useState<Device | null | undefined>();

  const { updateState, triggerUpdate } = useUpdateFirmware({
    deviceId: device?.deviceId,
  });

  return (
    <>
      {device ? (
        <NavigationScrollView>
          <Flex flex={1} p={16}>
            <Button
              type="main"
              my={4}
              onPress={triggerUpdate}
              disabled={!triggerUpdate}
            >
              Trigger Update
            </Button>
            <Text variant="h1">Update State:</Text>
            <Text variant="h4">Step:</Text>
            <Text variant="paragraph">{updateState.step}</Text>
            <Text variant="h4">Progress:</Text>
            <Text variant="paragraph">{updateState.progress}</Text>
            <Text variant="h4">Locked device:</Text>
            <Text variant="paragraph">
              {updateState.lockedDevice.toString()}
            </Text>
            <Text variant="h4">Error:</Text>
            <Text variant="paragraph">{JSON.stringify(updateState.error)}</Text>
          </Flex>
        </NavigationScrollView>
      ) : (
        <Flex p={5} flex={1}>
          <SelectDevice onSelect={setDevice} />
        </Flex>
      )}
    </>
  );
}
