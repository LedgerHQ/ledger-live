import React, { useMemo } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { useDispatch } from "~/context/hooks";
import { SafeAreaView } from "react-native-safe-area-context";
import invariant from "invariant";
import { useTheme } from "@react-navigation/native";
import { Account } from "@ledgerhq/types-live";
import { useSignWithDevice } from "~/logic/screenTransactionHooks";
import { updateAccountWithUpdater } from "~/actions/accounts";
import { TrackScreen } from "~/analytics";
import PreventNativeBack from "~/components/PreventNativeBack";
import ValidateOnDevice from "~/components/ValidateOnDevice";
import SkipLock from "~/components/behaviour/SkipLock";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { StellarAddAssetFlowParamList } from "./types";
import { ScreenName } from "~/const";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";

type Props = StackNavigatorProps<
  StellarAddAssetFlowParamList,
  ScreenName.StellarAddAssetValidation
>;

export default function Validation({ route }: Props) {
  const { colors } = useTheme();
  const { account } = useAccountScreen(route);
  invariant(account, "account is required");
  const dispatch = useDispatch();
  const [signing, signed] = useSignWithDevice({
    context: "StellarAddAsset",
    account,
    parentAccount: undefined,
    updateAccountWithUpdater: (accountId: string, updater: (account: Account) => Account) =>
      dispatch(updateAccountWithUpdater({ accountId, updater })),
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
      <TrackScreen category="StellarAddAsset" name="Validation" signed={signed} />
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
