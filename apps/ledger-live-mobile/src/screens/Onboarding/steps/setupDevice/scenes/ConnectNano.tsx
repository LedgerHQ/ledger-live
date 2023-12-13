import React, { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { trace } from "@ledgerhq/logs";
import { Flex } from "@ledgerhq/native-ui";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useFeature } from "@ledgerhq/live-config/featureFlags/index";
import { Result } from "@ledgerhq/live-common/hw/actions/manager";
import DeviceActionModal from "~/components/DeviceActionModal";
import SelectDevice from "~/components/SelectDevice";
import SelectDevice2 from "~/components/SelectDevice2";
import { TrackScreen } from "~/analytics";
import Button from "~/components/PreventDoubleClickButton";

import {
  setHasInstalledAnyApp,
  setHasOrderedNano,
  setLastConnectedDevice,
  setReadOnlyMode,
} from "~/actions/settings";
import { useManagerDeviceAction } from "~/hooks/deviceActions";

const ConnectNanoScene = ({
  onNext,
  deviceModelId,
}: {
  onNext: () => void;
  deviceModelId: string;
}) => {
  const action = useManagerDeviceAction();
  const dispatch = useDispatch();
  const [device, setDevice] = useState<Device | undefined>();

  const newDeviceSelectionFeatureFlag = useFeature("llmNewDeviceSelection");

  // Does not react to an header update request:
  // Keeping the header (back arrow and information button) from the onboarding.
  const requestToSetHeaderOptions = useCallback(() => undefined, []);

  const onSelectDevice = useCallback(
    (device: Device) => {
      const isUsbDevice = device.deviceId.startsWith("usb|");
      trace({ type: "onboarding", message: "Selected device", data: { isUsbDevice } });

      dispatch(setLastConnectedDevice(device));
      dispatch(setReadOnlyMode(false));
      dispatch(setHasOrderedNano(false));

      // Goes through an "allow secure connection"/genuine check device action
      if (isUsbDevice || newDeviceSelectionFeatureFlag?.enabled) {
        setDevice(device);
      }
      // The BLE pairing flow on the old device selection will handle the "allow secure connection"/genuine check device action step
      else {
        onNext();
      }
    },
    [dispatch, newDeviceSelectionFeatureFlag?.enabled, onNext],
  );

  const onResult = useCallback(
    (info: Result) => {
      /** if list apps succeed we update settings with state of apps installed */
      if (info) {
        const hasAnyAppinstalled = !!(
          info.result &&
          info.result.installed &&
          info.result.installed.length > 0
        );

        dispatch(setHasInstalledAnyApp(hasAnyAppinstalled));
        setDevice(undefined);
        dispatch(setReadOnlyMode(false));
        dispatch(setHasOrderedNano(false));
        onNext();
      }
    },
    [dispatch, onNext],
  );

  // Other models can be connected via BLE or USB
  const modelIsUsbOnly = ["nanoS", "nanoSP", "blue"].includes(deviceModelId);

  return (
    <>
      <TrackScreen category="Onboarding" name="PairNew" />
      <Flex flex={1}>
        {newDeviceSelectionFeatureFlag?.enabled ? (
          <SelectDevice2
            onSelect={onSelectDevice}
            stopBleScanning={!!device}
            requestToSetHeaderOptions={requestToSetHeaderOptions}
            isChoiceDrawerDisplayedOnAddDevice={false}
            hasPostOnboardingEntryPointCard
          />
        ) : (
          <SelectDevice
            withArrows
            usbOnly={modelIsUsbOnly}
            onSelect={onSelectDevice}
            autoSelectOnAdd
            hideAnimation
          />
        )}
      </Flex>
      <DeviceActionModal
        onClose={() => setDevice(undefined)}
        device={device}
        onResult={onResult}
        action={action}
        request={null}
      />
    </>
  );
};

ConnectNanoScene.id = "ConnectNanoScene";
ConnectNanoScene.contentContainerStyle = { padding: 16, flex: 1 };

const Next = ({ onNext }: { onNext: () => void }) => {
  const dispatch = useDispatch();

  return __DEV__ ? (
    <Button
      mt={7}
      type="color"
      outline
      onPress={() => {
        dispatch(setReadOnlyMode(false));
        dispatch(setHasOrderedNano(false));
        onNext();
      }}
    >
      (DEV) SKIP THIS STEP
    </Button>
  ) : null;
};

ConnectNanoScene.Next = Next;

export default ConnectNanoScene;
