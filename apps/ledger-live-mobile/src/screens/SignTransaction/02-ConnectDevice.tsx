import invariant from "invariant";
import React, { memo, useMemo } from "react";
import { StyleSheet } from "react-native";
import { useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { useTheme } from "@react-navigation/native";
import { accountScreenSelector } from "~/reducers/accounts";
import DeviceAction from "~/components/DeviceAction";
import { TrackScreen } from "~/analytics";
import { useSignedTxHandlerWithoutBroadcast } from "~/logic/screenTransactionHooks";
import { navigateToSelectDevice } from "../ConnectDevice";
import { SignTransactionNavigatorParamList } from "~/components/RootNavigator/types/SignTransactionNavigator";
import { ScreenName } from "~/const";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { useTransactionDeviceAction } from "~/hooks/deviceActions";

function ConnectDevice({
  navigation,
  route,
}: StackNavigatorProps<
  SignTransactionNavigatorParamList,
  ScreenName.SignTransactionConnectDevice
>) {
  const action = useTransactionDeviceAction();
  const { colors } = useTheme();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  invariant(account, "account is required");
  const { appName, onSuccess } = route.params;
  const mainAccount = getMainAccount(account, parentAccount);
  const { transaction, status } = useBridgeTransaction(() => ({
    account: mainAccount,
    transaction: route.params.transaction,
  }));
  const tokenCurrency = account.type === "TokenAccount" ? account.token : undefined;
  const handleTx = useSignedTxHandlerWithoutBroadcast({
    onSuccess,
  });

  const request = useMemo(
    () => ({
      account,
      parentAccount,
      appName,
      transaction,
      status,
      tokenCurrency,
      dependencies: [mainAccount],
      requireLatestFirmware: true,
    }),
    [account, appName, mainAccount, parentAccount, status, tokenCurrency, transaction],
  );
  return transaction ? (
    <SafeAreaView
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <TrackScreen category={route.name.replace("ConnectDevice", "")} name="ConnectDevice" />
      <DeviceAction
        action={action}
        // @ts-expect-error Wrong types?
        request={request}
        device={route.params.device}
        // @ts-expect-error onResult dissonance
        onResult={handleTx}
        onSelectDeviceLink={() => navigateToSelectDevice(navigation, route)}
      />
    </SafeAreaView>
  ) : null;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 16,
  },
});
export default memo(ConnectDevice);
