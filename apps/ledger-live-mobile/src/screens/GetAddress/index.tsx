import React, { useCallback, useState } from "react";
import { StyleSheet } from "react-native";
import { firstValueFrom } from "rxjs";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@react-navigation/native";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { TrackScreen } from "~/analytics";
import SelectDevice2 from "~/components/SelectDevice2";
import DeviceActionModal from "~/components/DeviceActionModal";
import { RootComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { ScreenName } from "~/const";
import { useAppDeviceAction } from "~/hooks/deviceActions";
import { Result } from "@ledgerhq/coin-framework/lib/derivation";
import { AppResult } from "@ledgerhq/live-common/hw/actions/app";

type NavigationProps = RootComposite<
  StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.GetAddress>
>;

const edges = ["left", "right"] as const;

export default function GetAddress({ navigation, route }: NavigationProps) {
  const action = useAppDeviceAction();
  const { colors } = useTheme();
  const [device, setDevice] = useState<Device>();

  const { account, path, onSuccess, onError } = route.params;

  const handleClose = useCallback(() => {
    setDevice(undefined);
  }, []);

  // Does not react to an header update request, the header stays the same.
  const requestToSetHeaderOptions = useCallback(() => undefined, []);

  const getAddress = useCallback(
    (device: Device) => {
      return new Promise<Result>((resolve, reject) => {
        firstValueFrom(
          getAccountBridge(account).receive(account, {
            deviceId: device.deviceId,
            path,
          }),
        ).then(resolve, reject);
      });
    },
    [account, path],
  );

  const handleResult = useCallback(
    ({ device }: AppResult) => {
      getAddress(device)
        .then(onSuccess, onError)
        .finally(() => {
          navigation.pop();
        });
    },
    [getAddress, navigation, onError, onSuccess],
  );

  return (
    <SafeAreaView
      edges={edges}
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <TrackScreen category="VerifyAccount" name="ConnectDevice" />
      <SelectDevice2
        onSelect={setDevice}
        stopBleScanning={!!device}
        requestToSetHeaderOptions={requestToSetHeaderOptions}
      />
      {device ? (
        <DeviceActionModal
          action={action}
          device={device}
          onClose={handleClose}
          request={{
            account,
          }}
          onResult={handleResult}
        />
      ) : null}
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  bodyError: {
    flex: 1,
    flexDirection: "column",
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 16,
  },
});
