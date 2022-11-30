import React, { useCallback, useEffect, useState } from "react";
import { ScrollView } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Flex } from "@ledgerhq/native-ui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { PostOnboardingActionId } from "@ledgerhq/types-live";
import {
  completeCustomImageFlow,
  setLastConnectedDevice,
  setReadOnlyMode,
} from "../../actions/settings";
import { ScreenName } from "../../const";
import CustomImageDeviceAction from "../../components/CustomImageDeviceAction";
import TestImage from "../../components/CustomImage/TestImage";
import SelectDevice from "../../components/SelectDevice";
import { useCompleteActionCallback } from "../../logic/postOnboarding/useCompleteAction";
import {
  BaseComposite,
  StackNavigatorProps,
} from "../../components/RootNavigator/types/helpers";
import { CustomImageNavigatorParamList } from "../../components/RootNavigator/types/CustomImageNavigator";
import { addKnownDevice } from "../../actions/ble";
import { lastConnectedDeviceSelector } from "../../reducers/settings";

const deviceModelIds = [DeviceModelId.nanoFTS];

type NavigationProps = BaseComposite<
  StackNavigatorProps<
    CustomImageNavigatorParamList,
    ScreenName.CustomImageStep3Transfer
  >
>;

/**
 * UI component that reconstructs an image from the raw hex data received as a
 * route param, and compares it to the preview base64 URI data received as a
 * route param.
 *
 * This is meant as a data validation. We want to validate that the raw data
 * (that is eventually what will be transfered) allows to reconstruct exactly
 * the image previewed on the previous screen.
 *
 * We take this raw data and use it to rebuild the image from scratch, then
 * we try to match the binary value of the "previewed" image and the "reconstructed"
 * image.
 */
const Step3Transfer = ({ route, navigation }: NavigationProps) => {
  const dispatch = useDispatch();
  const { rawData, device: deviceFromRoute, previewData } = route.params;

  const [device, setDevice] = useState<Device | null>(deviceFromRoute);
  const lastConnectedDevice = useSelector(lastConnectedDeviceSelector);

  useEffect(() => {
    if (!device && lastConnectedDevice?.modelId === DeviceModelId.nanoFTS) {
      setDevice(lastConnectedDevice);
    }
  }, [lastConnectedDevice, device]);

  const handleError = useCallback(
    (error: Error) => {
      console.error(error);
      navigation.navigate(ScreenName.CustomImageErrorScreen, { error, device });
    },
    [navigation, device],
  );

  const handleDeviceSelected = useCallback(
    (device: Device) => {
      dispatch(setReadOnlyMode(false));
      dispatch(
        addKnownDevice({
          ...device,
          id: device.deviceId,
          name: device.deviceName || "",
        }),
      );
      dispatch(setLastConnectedDevice(device));
      setDevice(device);
    },
    [dispatch],
  );

  const completeAction = useCompleteActionCallback();

  const handleExit = useCallback(() => {
    navigation.getParent()?.goBack();
  }, [navigation]);

  const handleResult = useCallback(() => {
    completeAction(PostOnboardingActionId.customImage);
    dispatch(completeCustomImageFlow());
    handleExit();
  }, [completeAction, dispatch, handleExit]);

  const insets = useSafeAreaInsets();
  const DEBUG = false;
  return (
    <ScrollView
      contentContainerStyle={{
        paddingBottom: insets.bottom,
        justifyContent: DEBUG ? "flex-start" : "center",
        flex: DEBUG ? undefined : 1,
      }}
    >
      <Flex p={6} flex={1} justifyContent="center" alignItems="center">
        {device ? (
          <CustomImageDeviceAction
            device={device}
            hexImage={rawData.hexData}
            source={{ uri: previewData.imageBase64DataUri }}
            onResult={handleResult}
            onSkip={handleExit}
          />
        ) : (
          <Flex flex={1} alignSelf="stretch">
            <SelectDevice
              onSelect={handleDeviceSelected}
              deviceModelIds={deviceModelIds}
              autoSelectOnAdd
            />
          </Flex>
        )}
        {DEBUG && <TestImage onError={handleError} {...route.params} />}
      </Flex>
    </ScrollView>
  );
};

export default Step3Transfer;
