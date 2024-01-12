import React, { useCallback, useMemo, useState } from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { useTheme } from "@react-navigation/native";
import { getMainAccount, getReceiveFlowError } from "@ledgerhq/live-common/account/index";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useFeature } from "@ledgerhq/live-config/featureFlags/index";
import { Flex } from "@ledgerhq/native-ui";
import { accountScreenSelector } from "~/reducers/accounts";
import { TrackScreen } from "~/analytics";
import SelectDevice from "~/components/SelectDevice";
import SelectDevice2 from "~/components/SelectDevice2";
import DeviceActionModal from "~/components/DeviceActionModal";
import NavigationScrollView from "~/components/NavigationScrollView";
import GenericErrorView from "~/components/GenericErrorView";
import SkipDeviceVerification from "./SkipDeviceVerification";
import VerifyAddress from "./VerifyAddress";
import QueuedDrawer from "~/components/QueuedDrawer";
import { RootComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { ScreenName } from "~/const";
import { useAppDeviceAction } from "~/hooks/deviceActions";

type NavigationProps = RootComposite<
  StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.VerifyAccount>
>;

export default function VerifyAccount({ navigation, route }: NavigationProps) {
  const action = useAppDeviceAction();
  const { colors } = useTheme();
  const { parentAccount } = useSelector(accountScreenSelector(route));
  const [device, setDevice] = useState<Device | null | undefined>();
  const [skipDevice, setSkipDevice] = useState(false);

  const newDeviceSelectionFeatureFlag = useFeature("llmNewDeviceSelection");

  const { account, onSuccess, onError } = route.params;
  const mainAccount = getMainAccount(account, parentAccount);
  const error = useMemo(
    () => (account ? getReceiveFlowError(account, parentAccount) : null),
    [account, parentAccount],
  );
  const onDone = useCallback(() => {
    navigation.pop();
  }, [navigation]);
  const onConfirm = useCallback(
    (confirmed: boolean, error?: Error) => {
      if (confirmed) {
        onSuccess(account);
      } else if (error) {
        onError(error);
      }

      onDone();
    },
    [account, onSuccess, onError, onDone],
  );

  const onConfirmSkip = useCallback(() => {
    onSuccess(account);
    onDone();
  }, [account, onSuccess, onDone]);

  const onSkipDevice = useCallback(() => {
    setSkipDevice(true);
  }, []);

  const handleSkipClose = useCallback(() => {
    setSkipDevice(false);
  }, []);

  const handleClose = useCallback(() => {
    setDevice(undefined);
  }, []);

  // Does not react to an header update request, the header stays the same.
  const requestToSetHeaderOptions = useCallback(() => undefined, []);

  if (!account) return null;

  if (error) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.bodyError}>
          <GenericErrorView error={error} />
        </View>
      </SafeAreaView>
    );
  }

  const tokenCurrency = account && account.type === "TokenAccount" ? account.token : undefined;
  return (
    <SafeAreaView
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <TrackScreen category="VerifyAccount" name="ConnectDevice" />
      {newDeviceSelectionFeatureFlag?.enabled ? (
        <Flex px={16} py={8} flex={1}>
          <SelectDevice2
            onSelect={setDevice}
            stopBleScanning={!!device}
            requestToSetHeaderOptions={requestToSetHeaderOptions}
          />
        </Flex>
      ) : (
        <NavigationScrollView style={styles.scroll} contentContainerStyle={styles.scrollContainer}>
          <SelectDevice onSelect={setDevice} onWithoutDevice={onSkipDevice} />
        </NavigationScrollView>
      )}

      {device ? (
        <DeviceActionModal
          action={action}
          device={device}
          onClose={handleClose}
          request={{
            account: mainAccount,
            tokenCurrency,
          }}
          renderOnResult={({ device }) => {
            return <VerifyAddress account={mainAccount} device={device} onResult={onConfirm} />;
          }}
        />
      ) : !device && skipDevice ? (
        <QueuedDrawer isRequestingToBeOpened={skipDevice} onClose={handleSkipClose}>
          <View style={styles.modalContainer}>
            <SkipDeviceVerification
              onCancel={handleSkipClose}
              onConfirm={onConfirmSkip}
              account={account}
            />
          </View>
        </QueuedDrawer>
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
  scroll: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
  },
  modalContainer: {
    flexDirection: "row",
  },
});
