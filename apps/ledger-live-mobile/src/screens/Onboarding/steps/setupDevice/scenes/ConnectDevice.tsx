import React, { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { trace } from "@ledgerhq/logs";
import { Flex } from "@ledgerhq/native-ui";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Result } from "@ledgerhq/live-common/hw/actions/manager";
import DeviceActionModal from "~/components/DeviceActionModal";
import SelectDevice2 from "~/components/SelectDevice2";
import Button from "~/components/PreventDoubleClickButton";

import {
  setHasInstalledAnyApp,
  setHasOrderedNano,
  setLastConnectedDevice,
  setReadOnlyMode,
} from "~/actions/settings";
import { useManagerDeviceAction } from "~/hooks/deviceActions";

const ConnectDevice = ({ onSuccess }: { onSuccess: () => void }) => {
  const action = useManagerDeviceAction();
  const dispatch = useDispatch();
  const [device, setDevice] = useState<Device | undefined>();

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
      setDevice(device);
    },
    [dispatch],
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
        onSuccess();
      }
    },
    [dispatch, onSuccess],
  );

  return (
    <>
      <Flex flex={1}>
        <SelectDevice2
          onSelect={onSelectDevice}
          stopBleScanning={!!device}
          requestToSetHeaderOptions={requestToSetHeaderOptions}
          isChoiceDrawerDisplayedOnAddDevice={false}
          hasPostOnboardingEntryPointCard
        />
      </Flex>
      <DeviceActionModal
        onClose={() => setDevice(undefined)}
        device={device}
        onResult={onResult}
        action={action}
        request={null}
      />
      {__DEV__ ? (
        <Button
          mt={7}
          type="color"
          outline
          onPress={() => {
            dispatch(setReadOnlyMode(false));
            dispatch(setHasOrderedNano(false));
            onSuccess();
          }}
        >
          (DEV) SKIP THIS STEP
        </Button>
      ) : null}
    </>
  );
};

export default ConnectDevice;
