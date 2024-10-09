import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";
import { firstValueFrom } from "rxjs";
import { Flex } from "@ledgerhq/native-ui";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@react-navigation/native";
import type { Result } from "@ledgerhq/coin-framework/lib/derivation";
import type { AppResult } from "@ledgerhq/live-common/hw/actions/app";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { TrackScreen } from "~/analytics";
import SelectDevice2 from "~/components/SelectDevice2";
import DeviceActionModal from "~/components/DeviceActionModal";
import { RootComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { ScreenName } from "~/const";
import { useAppDeviceAction } from "~/hooks/deviceActions";
import { renderLoading } from "~/components/DeviceAction/rendering";

type NavigationProps = RootComposite<
  StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.GetAddress>
>;

const edges = ["left", "right"] as const;

function GetAddressOnResult({
  device,
  handleResult,
}: {
  device: Device;
  handleResult: (device: Device) => void;
}) {
  const { t } = useTranslation();

  useEffect(() => {
    handleResult(device);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return renderLoading({
    t,
    lockModal: true,
  });
}

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

  const renderOnResult = useCallback(
    ({ device }: AppResult) => {
      return (
        <GetAddressOnResult
          device={device}
          handleResult={device => {
            getAddress(device)
              .then(onSuccess, onError)
              .finally(() => {
                navigation.pop();
              });
          }}
        />
      );
    },
    [getAddress, navigation, onError, onSuccess],
  );

  const request = useMemo(() => {
    return {
      account,
    };
  }, [account]);

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
      <TrackScreen category="GetAddress" name="ConnectDevice" />
      <Flex flex={1} mb={8}>
        <SelectDevice2
          onSelect={setDevice}
          stopBleScanning={!!device}
          requestToSetHeaderOptions={requestToSetHeaderOptions}
        />
      </Flex>
      {device ? (
        <DeviceActionModal
          action={action}
          device={device}
          onClose={handleClose}
          request={request}
          renderOnResult={renderOnResult}
        />
      ) : null}
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
