import React, { useCallback, useState } from "react";
import { Flex } from "@ledgerhq/native-ui";
import { useDispatch, useSelector } from "react-redux";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import connectManager from "@ledgerhq/live-common/hw/connectManager";
import { createAction, Result } from "@ledgerhq/live-common/hw/actions/manager";
import DeviceActionModal from "../../../../../components/DeviceActionModal";
import SelectDevice from "../../../../../components/SelectDevice";
import SelectDevice2 from "../../../../../components/SelectDevice2";
import { TrackScreen, updateIdentify } from "../../../../../analytics";
import Button from "../../../../../components/PreventDoubleClickButton";

import {
  installAppFirstTime,
  setHasOrderedNano,
  setLastConnectedDevice,
  setReadOnlyMode,
} from "../../../../../actions/settings";
import { updateUser } from "../../../../../user";
import { readOnlyModeEnabledSelector } from "../../../../../reducers/settings";

const action = createAction(connectManager);

const ConnectNanoScene = ({
  onNext,
  deviceModelId,
}: {
  onNext: () => void;
  deviceModelId: string;
}) => {
  const dispatch = useDispatch();
  const readOnlyMode = useSelector(readOnlyModeEnabledSelector);
  const [device, setDevice] = useState<Device | undefined>();

  const newDeviceSelectionFeatureFlag = useFeature("llmNewDeviceSelection");

  const onSetDevice = useCallback(
    async (device: Device) => {
      if (readOnlyMode) {
        await updateUser();
        await updateIdentify();
      }
      dispatch(setLastConnectedDevice(device));
      setDevice(device);
      dispatch(setReadOnlyMode(false));
      dispatch(setHasOrderedNano(false));
    },
    [dispatch, readOnlyMode],
  );

  const directNext = useCallback(
    async device => {
      if (readOnlyMode) {
        await updateUser();
        await updateIdentify();
      }
      dispatch(setLastConnectedDevice(device));
      dispatch(setReadOnlyMode(false));
      dispatch(setHasOrderedNano(false));
      onNext();
    },
    [dispatch, onNext, readOnlyMode],
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

        dispatch(installAppFirstTime(hasAnyAppinstalled));
        setDevice(undefined);
        dispatch(setReadOnlyMode(false));
        dispatch(setHasOrderedNano(false));
        onNext();
      }
    },
    [dispatch, onNext],
  );

  const usbOnly = ["nanoS", "nanoSP", "blue"].includes(deviceModelId);

  return (
    <>
      <TrackScreen category="Onboarding" name="PairNew" />
      <Flex flex={1}>
        {newDeviceSelectionFeatureFlag?.enabled ? (
          <SelectDevice2 onSelect={onSetDevice} stopBleScanning={!!device} />
        ) : (
          <SelectDevice
            withArrows
            usbOnly={usbOnly}
            onSelect={usbOnly ? onSetDevice : directNext}
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
