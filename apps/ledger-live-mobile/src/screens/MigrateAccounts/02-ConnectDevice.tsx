import React, { useCallback, useState } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { createAction } from "@ledgerhq/live-common/hw/actions/app";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import connectApp from "@ledgerhq/live-common/hw/connectApp";
import { Flex } from "@ledgerhq/native-ui";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useTheme } from "@react-navigation/native";
import { TrackScreen } from "../../analytics";
import { ScreenName } from "../../const";
import SelectDevice from "../../components/SelectDevice";
import SelectDevice2 from "../../components/SelectDevice2";
import NavigationScrollView from "../../components/NavigationScrollView";
import DeviceActionModal from "../../components/DeviceActionModal";
import type { MigrateAccountsNavigatorParamList } from "../../components/RootNavigator/types/MigrateAccountsFlowNavigator";
import type { StackNavigatorProps } from "../../components/RootNavigator/types/helpers";

const action = createAction(connectApp);
type Props = StackNavigatorProps<
  MigrateAccountsNavigatorParamList,
  ScreenName.MigrateAccountsConnectDevice
>;

export default function ConnectDevice({ navigation, route }: Props) {
  const { colors } = useTheme();
  const [device, setDevice] = useState<Device | null>(null);

  const newDeviceSelectionFeatureFlag = useFeature("llmNewDeviceSelection");

  const onResult = useCallback(
    result => {
      setDevice(null);
      navigation.navigate(ScreenName.MigrateAccountsProgress, {
        currency: route.params?.currency,
        ...result,
      });
    },
    [navigation, route.params],
  );
  const onClose = useCallback(() => {
    setDevice(null);
  }, []);
  return (
    <SafeAreaView
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <TrackScreen category="MigrateAccount" name="ConnectDevice" />
      {newDeviceSelectionFeatureFlag?.enabled ? (
        <Flex px={16} py={8} flex={1}>
          <SelectDevice2 onSelect={setDevice} stopBleScanning={!!device} />
        </Flex>
      ) : (
        <NavigationScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContainer}
        >
          <SelectDevice onSelect={setDevice} autoSelectOnAdd />
        </NavigationScrollView>
      )}
      <DeviceActionModal
        action={action}
        device={device}
        onResult={onResult}
        onClose={onClose}
        request={{
          currency: route.params.currency,
        }}
        // FIXME: DeviceActionModal DOES NOT ACCEPT appName
        // appName={route.params.appName}
      />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
  },
});
