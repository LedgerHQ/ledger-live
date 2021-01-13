// @flow
import invariant from "invariant";
import React, { useCallback, useMemo } from "react";
import { StyleSheet } from "react-native";
import { useSelector } from "react-redux";
import SafeAreaView from "react-native-safe-area-view";
import { useTranslation } from "react-i18next";
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
import { accountScreenSelector } from "../reducers/accounts";
import DeviceAction from "../components/DeviceAction";
import { renderLoading } from "../components/DeviceAction/rendering";
import { useSignedTxHandler } from "../logic/screenTransactionHooks";
import { TrackScreen } from "../analytics";

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
};

export default function ConnectDevice({ route }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  invariant(account, "account is required");

  const mainAccount = getMainAccount(account, parentAccount);

  const { transaction, status } = useBridgeTransaction(() => ({
    account: mainAccount,
    transaction: route.params.transaction,
  }));

  const tokenCurrency =
    account.type === "TokenAccount" ? account.token : undefined;

  const handleTx = useSignedTxHandler({
    account,
    parentAccount,
  });

  const onResult = useCallback(
    payload => {
      handleTx(payload);
      return renderLoading({ t });
    },
    [handleTx, t],
  );

  return useMemo(
    () =>
      transaction ? (
        <SafeAreaView
          style={[styles.root, { backgroundColor: colors.background }]}
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
              transaction,
              status,
              tokenCurrency,
            }}
            device={route.params.device}
            onResult={onResult}
          />
        </SafeAreaView>
      ) : null,
    // prevent rerendering caused by optimistic update (i.e. exclude account related deps)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [status, transaction, tokenCurrency],
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 16,
  },
});
