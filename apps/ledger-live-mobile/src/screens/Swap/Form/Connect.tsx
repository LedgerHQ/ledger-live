import React, { useState, useCallback, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { Flex } from "@ledgerhq/native-ui";
import { useFeature } from "@ledgerhq/live-config/featureFlags/index";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import SelectDevice from "~/components/SelectDevice";
import SelectDevice2, { SetHeaderOptionsRequest } from "~/components/SelectDevice2";
import DeviceActionModal from "~/components/DeviceActionModal";
import { TrackScreen } from "~/analytics";
import SkipSelectDevice from "../../SkipSelectDevice";
import { DeviceMeta } from "./Modal/Confirmation";
import { useManagerDeviceAction } from "~/hooks/deviceActions";

export function Connect({
  setResult,
  provider,
}: {
  setResult: (_: DeviceMeta) => void;
  provider?: string;
}) {
  const action = useManagerDeviceAction();

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

  const navigation = useNavigation();

  // Only reacts on an update request for the left part of the header
  // Keeping the rest of the header (exchange and history tab + close button) from the exchange screen.
  const requestToSetHeaderOptions = useCallback(
    (request: SetHeaderOptionsRequest) => {
      if (request.type === "set") {
        // SwapForm, rendering Connect, is wrapped in a Tab.Screen. To update the left header,
        // we need to set the options of the parent.
        navigation.getParent()?.setOptions({
          headerLeft: request.options.headerLeft,
        });
      } else {
        // Sets back the left part of the header to its initial values
        navigation.getParent()?.setOptions({
          headerLeft: () => null,
        });
      }
    },
    [navigation],
  );

  // Cleaning any updates to the parent's header from requestToSetHeaderOptions on unmount to be safe
  useEffect(() => {
    return () => {
      // Sets back the left part of the header to its initial values
      navigation.getParent()?.setOptions({
        headerLeft: () => null,
      });
    };
  }, [navigation]);

  return (
    <Flex padding={4}>
      <TrackScreen category="Swap Form" name="ConnectDeviceListApps" provider={provider} />
      <SkipSelectDevice onResult={setDevice} />
      {newDeviceSelectionFeatureFlag?.enabled ? (
        <Flex height="100%" px={2} py={2}>
          <SelectDevice2
            onSelect={setDevice}
            stopBleScanning={!!device}
            requestToSetHeaderOptions={requestToSetHeaderOptions}
          />
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
