import React, { useState, useCallback } from "react";
import { Flex } from "@ledgerhq/native-ui";
import connectManager from "@ledgerhq/live-common/hw/connectManager";
import { createAction } from "@ledgerhq/live-common/hw/actions/manager";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import SelectDevice from "../../../components/SelectDevice";
import SelectDevice2 from "../../../components/SelectDevice2";
import DeviceActionModal from "../../../components/DeviceActionModal";
import { TrackScreen } from "../../../analytics";
import SkipSelectDevice from "../../SkipSelectDevice";
import { DeviceMeta } from "./Modal/Confirmation";

const action = createAction(connectManager);

export function Connect({
  setResult,
  provider,
}: {
  setResult: (_: DeviceMeta) => void;
  provider?: string;
}) {
  const [device, setDevice] = useState<Device>();
  const [result] = useState();

  const newDeviceSelectionFeatureFlag = useFeature("llmNewDeviceSelection");

  const onModalHide = useCallback(() => {
    if (result) {
      // Nb need this in order to wait for the first modal to hide
      // see https://github.com/react-native-modal/react-native-modal#i-cant-show-multiple-modals-one-after-another
      setResult(result);
    }
  }, [result, setResult]);

  return (
    <Flex padding={4}>
      <TrackScreen
        category="Swap Form"
        name="ConnectDeviceListApps"
        provider={provider}
      />
      <SkipSelectDevice onResult={setDevice} />
      {newDeviceSelectionFeatureFlag?.enabled ? (
        <Flex px={16} py={8} flex={1}>
          <SelectDevice2 onSelect={setDevice} stopBleScanning={!!device} />
        </Flex>
      ) : (
        <SelectDevice onSelect={setDevice} autoSelectOnAdd />
      )}
      <DeviceActionModal
        onClose={() => setDevice(undefined)}
        onModalHide={onModalHide}
        device={result ? null : device}
        onResult={setResult}
        action={action}
        request={null}
        onSelectDeviceLink={() => setDevice(undefined)}
        analyticsPropertyFlow="swap"
      />
    </Flex>
  );
}
