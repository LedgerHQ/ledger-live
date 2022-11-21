import React, { useCallback, useState } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@react-navigation/native";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { AppResult, createAction } from "@ledgerhq/live-common/hw/actions/app";
import connectApp from "@ledgerhq/live-common/hw/connectApp";
import { TrackScreen } from "../../analytics";
import SelectDevice from "../../components/SelectDevice";
import DeviceActionModal from "../../components/DeviceActionModal";
import NavigationScrollView from "../../components/NavigationScrollView";
import {
  RootComposite,
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "../../components/RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "../../components/RootNavigator/types/BaseNavigator";
import { ScreenName } from "../../const";
import SkipSelectDevice from "../SkipSelectDevice";
import { RootStackParamList } from "../../components/RootNavigator/types/RootNavigator";

const action = createAction(connectApp);

type NavigationProps = RootComposite<
  StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.DeviceConnect>
>;

export default function DeviceConnect({ navigation, route }: NavigationProps) {
  const { colors } = useTheme();
  const [device, setDevice] = useState<Device | null | undefined>();
  const { appName = "BOLOS", onSuccess, onError, onClose } = route.params;

  const onDone = useCallback(() => {
    const n =
      navigation.getParent<StackNavigatorNavigation<RootStackParamList>>();

    if (n) {
      n.pop();
    }
  }, [navigation]);

  const handleSuccess = useCallback(
    (result: AppResult) => {
      onSuccess(result);
      // Resets the device to avoid having
      // the bottom modal popping up again
      setDevice(undefined);
      onDone();
    },
    [onDone, onSuccess],
  );

  const handleClose = useCallback(() => {
    onClose();
    onDone();
  }, [onClose, onDone]);

  return (
    <SafeAreaView
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <TrackScreen category="DeviceConnect" name="ConnectDevice" />
      <NavigationScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContainer}
      >
        <SkipSelectDevice onResult={setDevice} />
        <SelectDevice onSelect={setDevice} />
      </NavigationScrollView>
      <DeviceActionModal
        action={action}
        device={device}
        onResult={handleSuccess}
        onClose={handleClose}
        onError={onError}
        request={{
          appName,
        }}
        analyticsPropertyFlow={"device connect"}
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
    backgroundColor: "transparent",
  },
  scrollContainer: {
    padding: 16,
  },
});
