import React, { useMemo } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import invariant from "invariant";
import { useTheme } from "@react-navigation/native";
import { useSignWithDevice } from "../../../logic/screenTransactionHooks";
import { updateAccountWithUpdater } from "../../../actions/accounts";
import { accountScreenSelector } from "../../../reducers/accounts";
import { TrackScreen } from "../../../analytics";
import PreventNativeBack from "../../../components/PreventNativeBack";
import ValidateOnDevice from "../../../components/ValidateOnDevice";
import SkipLock from "../../../components/behaviour/SkipLock";
import { ScreenName } from "../../../const";
import type { StackNavigatorProps } from "../../../components/RootNavigator/types/helpers";
import type { AlgorandOptInFlowParamList } from "./types";

type Props = StackNavigatorProps<
  AlgorandOptInFlowParamList,
  ScreenName.AlgorandOptInSummary
>;
export default function Validation({ route }: Props) {
  const { colors } = useTheme();
  const { account } = useSelector(accountScreenSelector(route));
  invariant(account, "account is required");
  const dispatch = useDispatch();
  const [signing, signed] = useSignWithDevice({
    context: "AlgorandOptIn",
    account,
    parentAccount: undefined,
    updateAccountWithUpdater: (...args) =>
      dispatch(updateAccountWithUpdater(...args)),
  });
  const { status, transaction, modelId, wired, deviceId } = route.params;
  const device = useMemo(
    () => ({
      deviceId,
      modelId,
      wired,
    }),
    [modelId, wired, deviceId],
  );
  return (
    <SafeAreaView
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <TrackScreen category="AlgorandOptIn" name="Validation" signed={signed} />
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
          device={device}
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
