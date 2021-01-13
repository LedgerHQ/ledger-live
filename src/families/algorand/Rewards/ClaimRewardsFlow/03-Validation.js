/* @flow */
import React from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import SafeAreaView from "react-native-safe-area-view";
import invariant from "invariant";
import type {
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/lib/types";
import type { DeviceModelId } from "@ledgerhq/devices";
import { useTheme } from "@react-navigation/native";
import { useSignWithDevice } from "../../../../logic/screenTransactionHooks";
import { updateAccountWithUpdater } from "../../../../actions/accounts";
import { accountScreenSelector } from "../../../../reducers/accounts";
import { TrackScreen } from "../../../../analytics";
import PreventNativeBack from "../../../../components/PreventNativeBack";
import ValidateOnDevice from "../../../../components/ValidateOnDevice";
import SkipLock from "../../../../components/behaviour/SkipLock";

const forceInset = { bottom: "always" };

type RouteParams = {
  accountId: string,
  deviceId: string,
  modelId: DeviceModelId,
  wired: boolean,
  transaction: Transaction,
  status: TransactionStatus,
};

type Props = {
  navigation: any,
  route: { params: RouteParams },
};

export default function Validation({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account } = useSelector(accountScreenSelector(route));
  invariant(account, "account is required");
  const dispatch = useDispatch();

  const [signing, signed] = useSignWithDevice({
    context: "AlgorandClaimRewards",
    account,
    parentAccount: undefined,
    navigation,
    updateAccountWithUpdater: (...args) =>
      dispatch(updateAccountWithUpdater(...args)),
  });

  const { status, transaction, modelId, wired } = route.params;

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.background }]}
      forceInset={forceInset}
    >
      <TrackScreen
        category="AlgorandClaimRewards"
        name="Validation"
        signed={signed}
      />
      {signing && (
        <>
          <PreventNativeBack />
          <SkipLock />
        </>
      )}

      {signed ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <ValidateOnDevice
          wired={wired}
          modelId={modelId}
          account={account}
          parentAccount={undefined}
          status={status}
          transaction={transaction}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  center: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
});
