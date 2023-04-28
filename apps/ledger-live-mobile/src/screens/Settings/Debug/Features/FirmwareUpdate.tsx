import React, { useCallback, useState } from "react";
import { TFunction, useTranslation } from "react-i18next";
import { Text, Flex, Button } from "@ledgerhq/native-ui";
import { useNavigation } from "@react-navigation/native";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useUpdateFirmware } from "@ledgerhq/live-common/deviceSDK/hooks/useUpdateFirmware";
import NavigationScrollView from "../../../../components/NavigationScrollView";
import SelectDevice, {
  SetHeaderOptionsRequest,
} from "../../../../components/SelectDevice2";
import { ReactNavigationHeaderOptions } from "../../../../components/RootNavigator/types/helpers";
import { NavigationHeaderBackButton } from "../../../../components/NavigationHeaderBackButton";

// Defines here some of the header options for this screen to be able to reset back to them.
// Showing an example of setting a translated title here.
export const debugFirmwareUpdateHeaderOptions = (
  t: TFunction,
): ReactNavigationHeaderOptions => ({
  headerShown: true,
  title: t("settings.debug.features.firmwareUpdate.headerTitle"),
  headerRight: () => null,
  headerLeft: () => <NavigationHeaderBackButton />,
});

export default function DebugFirmwareUpdate() {
  const navigation = useNavigation();
  const { t } = useTranslation();

  const [device, setDevice] = useState<Device | null | undefined>();

  const { updateState, triggerUpdate } = useUpdateFirmware({
    deviceId: device?.deviceId,
  });

  const requestToSetHeaderOptions = useCallback(
    (request: SetHeaderOptionsRequest) => {
      if (request.type === "set") {
        navigation.setOptions({
          title: "", // Example of removing the title during the pairing flow
          headerLeft: request.options.headerLeft,
          headerRight: request.options.headerRight,
        });
      } else {
        // Sets back the header to its initial values set for this screen
        navigation.setOptions({
          headerLeft: () => null,
          headerRight: () => null,
          ...debugFirmwareUpdateHeaderOptions(t),
        });
      }
    },
    [navigation, t],
  );

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
          <SelectDevice
            onSelect={setDevice}
            requestToSetHeaderOptions={requestToSetHeaderOptions}
          />
        </Flex>
      )}
    </>
  );
}
