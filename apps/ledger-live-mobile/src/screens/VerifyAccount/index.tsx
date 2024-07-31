import React, { useCallback, useMemo, useState } from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { getMainAccount, getReceiveFlowError } from "@ledgerhq/live-common/account/index";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Flex, Text } from "@ledgerhq/native-ui";
import { accountScreenSelector } from "~/reducers/accounts";
import { TrackScreen } from "~/analytics";
import SelectDevice2 from "~/components/SelectDevice2";
import DeviceActionModal from "~/components/DeviceActionModal";
import GenericErrorView from "~/components/GenericErrorView";
import SkipDeviceVerification from "./SkipDeviceVerification";
import VerifyAddress from "./VerifyAddress";
import QueuedDrawer from "~/components/QueuedDrawer";
import { RootComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { ScreenName } from "~/const";
import { useAppDeviceAction } from "~/hooks/deviceActions";
import Button from "~/components/wrappedUi/Button";

type NavigationProps = RootComposite<
  StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.VerifyAccount>
>;

const edges = ["left", "right"] as const;

export default function VerifyAccount({ navigation, route }: NavigationProps) {
  const action = useAppDeviceAction();
  const { colors } = useTheme();
  const { parentAccount } = useSelector(accountScreenSelector(route));
  const [device, setDevice] = useState<Device | null | undefined>();
  const [skipDevice, setSkipDevice] = useState(false);

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
      edges={edges}
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <TrackScreen category="VerifyAccount" name="ConnectDevice" />
      <Flex px={16} py={8} flex={1}>
        <SelectDevice2
          onSelect={setDevice}
          stopBleScanning={!!device}
          requestToSetHeaderOptions={requestToSetHeaderOptions}
        />
        <View>
          <View style={styles.header}>
            <Text style={styles.headerText} color="grey">
              <Trans i18nKey="SelectDevice.withoutDeviceHeader" />
            </Text>
          </View>
          <Button onPress={onSkipDevice} event="WithoutDevice" type={"main"} mt={6} mb={6}>
            <Trans i18nKey="SelectDevice.withoutDevice" />
          </Button>
        </View>
      </Flex>
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
  header: {
    alignItems: "center",
  },
  headerText: {
    fontSize: 14,
    lineHeight: 21,
  },
});
