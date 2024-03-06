import { CLSSupportedDeviceModelId } from "@ledgerhq/live-common/device-core/capabilities/isCustomLockScreenSupported";
import React, { useCallback } from "react";

import { SafeAreaView } from "react-native-safe-area-context";

import { CustomImageNavigatorParamList } from "~/components/RootNavigator/types/CustomImageNavigator";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { DeviceCards } from "../Onboarding/steps/Cards/DeviceCard";
import { supportedDeviceModelIds } from "@ledgerhq/live-common/device/use-cases/isCustomLockScreenSupported";
import { devices } from "../Onboarding/steps/deviceSelection";
import { getDeviceModel } from "@ledgerhq/devices";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { Flex } from "@ledgerhq/native-ui";
import { TrackScreen } from "~/analytics";

type NavigationProps = BaseComposite<
  StackNavigatorProps<CustomImageNavigatorParamList, ScreenName.CustomImagePreviewDevicePicker>
>;

const analyticsScreenName = "Preview of the lockscreen picture (device selection)";

const PreviewDevicePicker = ({ navigation, route }: NavigationProps) => {
  const { params } = route;

  const onSelectDeviceModelId = useCallback(
    (deviceModelId: CLSSupportedDeviceModelId) => {
      navigation.navigate(ScreenName.CustomImagePreviewPreEdit, {
        ...params,
        deviceModelId,
      });
    },
    [navigation, params],
  );

  const getProductName = (modelId: DeviceModelId) =>
    getDeviceModel(modelId)?.productName.replace("Ledger", "").trimStart() || modelId;

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <TrackScreen category={analyticsScreenName} />
      <Flex px={6}>
        <DeviceCards
          cards={supportedDeviceModelIds
            .map(deviceModelId => ({ deviceModelId, device: devices[deviceModelId] }))
            .map(({ deviceModelId, device }) => ({
              id: device.id,
              img: device.img,
              title: getProductName(device.id),
              compatible: true,
              onPress: () => onSelectDeviceModelId(deviceModelId),
              event: "button_clicked",
              eventProperties: { button: device.id },
            }))}
        />
      </Flex>
    </SafeAreaView>
  );
};

export default PreviewDevicePicker;
