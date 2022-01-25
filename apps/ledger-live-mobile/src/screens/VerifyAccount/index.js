// @flow

import React, { useCallback, useMemo, useState } from "react";
import { View, StyleSheet } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import { useSelector } from "react-redux";
import { useTheme } from "@react-navigation/native";
import {
  getMainAccount,
  getReceiveFlowError,
} from "@ledgerhq/live-common/lib/account";
import type { Account } from "@ledgerhq/live-common/lib/types/account";
import type { Device } from "@ledgerhq/live-common/lib/hw/actions/types";
import { createAction } from "@ledgerhq/live-common/lib/hw/actions/app";
import connectApp from "@ledgerhq/live-common/lib/hw/connectApp";

import { accountScreenSelector } from "../../reducers/accounts";
import { TrackScreen } from "../../analytics";
import SelectDevice from "../../components/SelectDevice";
import DeviceActionModal from "../../components/DeviceActionModal";
import NavigationScrollView from "../../components/NavigationScrollView";
import GenericErrorView from "../../components/GenericErrorView";
import SkipDeviceVerification from "./SkipDeviceVerification";
import VerifyAddress from "./VerifyAddress";
import BottomModal from "../../components/BottomModal";

const action = createAction(connectApp);

const forceInset = { bottom: "always" };

type Props = {
  navigation: any,
  route: { params: RouteParams },
};

type RouteParams = {
  accountId: string,
  parentId: string,
  title: string,
  account: Account,
  onSuccess: (account: Account) => void,
  onError: (error: Error) => void,
  onClose: () => void,
};

export default function VerifyAccount({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { parentAccount } = useSelector(accountScreenSelector(route));
  const [device, setDevice] = useState<?Device>();
  const [skipDevice, setSkipDevice] = useState<boolean>(false);
  const { account, onSuccess, onError, onClose } = route.params;

  const mainAccount = getMainAccount(account, parentAccount);

  const error = useMemo(
    () => (account ? getReceiveFlowError(account, parentAccount) : null),
    [account, parentAccount],
  );

  const onDone = useCallback(() => {
    const n = navigation.getParent();
    if (n) {
      n.pop();
    }
  }, [navigation]);

  const onConfirm = useCallback(
    (confirmed, error) => {
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

  const handleClose = useCallback(() => {
    onClose();
    onDone();
  }, [onClose, onDone]);

  if (!account) return null;

  if (error) {
    return (
      <SafeAreaView style={styles.root} forceInset={forceInset}>
        <View style={styles.bodyError}>
          <GenericErrorView error={error} />
        </View>
      </SafeAreaView>
    );
  }

  const tokenCurrency =
    account && account.type === "TokenAccount" && account.token;

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.background }]}
      forceInset={forceInset}
    >
      <TrackScreen category="VerifyAccount" name="ConnectDevice" />
      <NavigationScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContainer}
      >
        <SelectDevice
          onSelect={setDevice}
          onWithoutDevice={onSkipDevice}
          withoutDevice
        />
      </NavigationScrollView>

      {device ? (
        <DeviceActionModal
          action={action}
          device={device}
          onClose={handleClose}
          request={{ account: mainAccount, tokenCurrency }}
          renderOnResult={({ device }) => (
            <VerifyAddress
              account={mainAccount}
              device={device}
              onResult={onConfirm}
            />
          )}
        />
      ) : !device && skipDevice ? (
        <BottomModal id="DeviceActionModal" isOpened={true}>
          <View style={styles.modalContainer}>
            <SkipDeviceVerification
              onCancel={handleClose}
              onConfirm={onConfirmSkip}
              account={account}
            />
          </View>
        </BottomModal>
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
