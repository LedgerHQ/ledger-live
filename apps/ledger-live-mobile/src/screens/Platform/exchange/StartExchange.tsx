import startExchange from "@ledgerhq/live-common/exchange/platform/startExchange";
import { createAction } from "@ledgerhq/live-common/hw/actions/startExchange";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import connectApp from "@ledgerhq/live-common/hw/connectApp";
import React, { useCallback, useState } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DeviceActionModal from "../../../components/DeviceActionModal";
import type { StackNavigatorProps } from "../../../components/RootNavigator/types/helpers";
import {
  PlatformExchangeNavigatorParamList,
  ResultStart,
} from "../../../components/RootNavigator/types/PlatformExchangeNavigator";
import SelectDevice from "../../../components/SelectDevice";
import { ScreenName } from "../../../const";

type Props = StackNavigatorProps<
  PlatformExchangeNavigatorParamList,
  ScreenName.PlatformStartExchange
>;

const PlatformStartExchange: React.FC<Props> = ({ navigation, route }) => {
  const [device, setDevice] = useState<Device>();

  const onClose = useCallback(() => {
    navigation.pop();
  }, [navigation]);

  const onResult = useCallback(
    (result: ResultStart) => {
      route.params.onResult({ ...result, device });
    },
    [device, route.params],
  );

  return (
    <SafeAreaView style={styles.root}>
      <SelectDevice onSelect={setDevice} autoSelectOnAdd />
      <DeviceActionModal
        device={device}
        action={action}
        onClose={onClose}
        onResult={onResult}
        request={route.params.request}
      />
    </SafeAreaView>
  );
};

const action = createAction(connectApp, startExchange);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 32,
  },
});

export default PlatformStartExchange;
