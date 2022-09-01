import invariant from "invariant";
import React, { memo } from "react";
import { StyleSheet } from "react-native";
import { useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { createAction } from "@ledgerhq/live-common/hw/actions/transaction";
import connectApp from "@ledgerhq/live-common/hw/connectApp";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { useTheme } from "@react-navigation/native";
import { accountScreenSelector } from "../../reducers/accounts";
import DeviceAction from "../../components/DeviceAction";
import { TrackScreen } from "../../analytics";
import { useSignedTxHandlerWithoutBroadcast } from "../../logic/screenTransactionHooks";
import { navigateToSelectDevice } from "../ConnectDevice";
import { SignTransactionNavigatorParamList } from "../../components/RootNavigator/types/SignTransactionNavigator";
import { ScreenName } from "../../const";
import { StackNavigatorProps } from "../../components/RootNavigator/types/helpers";

const action = createAction(connectApp);

function ConnectDevice({
  navigation,
  route,
}: StackNavigatorProps<
  SignTransactionNavigatorParamList,
  ScreenName.SignTransactionConnectDevice
>) {
  const { colors } = useTheme();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  invariant(account, "account is required");
  const { appName, onSuccess } = route.params;
  const mainAccount = getMainAccount(account, parentAccount);
  const { transaction, status } = useBridgeTransaction(() => ({
    account: mainAccount,
    transaction: route.params.transaction,
  }));
  const tokenCurrency =
    account.type === "TokenAccount" ? account.token : undefined;
  const handleTx = useSignedTxHandlerWithoutBroadcast({
    onSuccess,
  });
  // Nb setting the mainAccount as a dependency will ensure latest versions of plugins.
  const dependencies = [mainAccount];
  return transaction ? (
    <SafeAreaView
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <TrackScreen
        category={route.name.replace("ConnectDevice", "")}
        name="ConnectDevice"
      />
      <DeviceAction
        action={action}
        request={{
          account,
          parentAccount,
          appName,
          transaction,
          status,
          tokenCurrency,
          dependencies,
          requireLatestFirmware: true,
        }}
        device={route.params.device}
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
