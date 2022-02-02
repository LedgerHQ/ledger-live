// @flow
import invariant from "invariant";
import React, { memo } from "react";
import { StyleSheet } from "react-native";
import { useSelector } from "react-redux";
import SafeAreaView from "react-native-safe-area-view";
import { getMainAccount } from "@ledgerhq/live-common/lib/account";
import type {
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/lib/types";
import { createAction } from "@ledgerhq/live-common/lib/hw/actions/transaction";
import connectApp from "@ledgerhq/live-common/lib/hw/connectApp";
import type { Device } from "@ledgerhq/live-common/lib/hw/actions/types";
import useBridgeTransaction from "@ledgerhq/live-common/lib/bridge/useBridgeTransaction";
import { useTheme } from "@react-navigation/native";
import { accountScreenSelector } from "../../reducers/accounts";
import DeviceAction from "../../components/DeviceAction";
import { TrackScreen } from "../../analytics";
import { useSignedTxHandlerWithoutBroadcast } from "../../logic/screenTransactionHooks";

const action = createAction(connectApp);

type Props = {
  navigation: any,
  route: {
    params: RouteParams,
    name: string,
  },
};

type RouteParams = {
  device: Device,
  accountId: string,
  transaction: Transaction,
  status: TransactionStatus,
  appName?: string,
  onSuccess: (payload: *) => void,
  onError: (error: Error) => void,
};

function ConnectDevice({ route }: Props) {
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
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
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

export default memo<Props>(ConnectDevice);
