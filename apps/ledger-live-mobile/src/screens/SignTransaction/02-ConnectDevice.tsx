import invariant from "invariant";
import React, { memo, useCallback, useMemo } from "react";
import { StyleSheet } from "react-native";
import { useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { dependenciesToAppRequests } from "@ledgerhq/live-common/hw/actions/app";
import { useTheme } from "@react-navigation/native";
import { TransactionResult } from "@ledgerhq/live-common/hw/actions/transaction";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { TransactionRefusedOnDevice } from "@ledgerhq/live-common/errors";
import { accountScreenSelector } from "~/reducers/accounts";
import DeviceAction from "~/components/DeviceAction";
import { TrackScreen } from "~/analytics";
import { SignTransactionNavigatorParamList } from "~/components/RootNavigator/types/SignTransactionNavigator";
import { ScreenName } from "~/const";
import type {
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import { useTransactionDeviceAction } from "~/hooks/deviceActions";
import logger from "~/logger";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";

export type SignTransactionConnectDeviceProps = StackNavigatorProps<
  SignTransactionNavigatorParamList,
  ScreenName.SignTransactionConnectDevice
>;

function ConnectDevice({ navigation, route }: SignTransactionConnectDeviceProps) {
  const action = useTransactionDeviceAction();
  const { colors } = useTheme();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  invariant(account, "account is required");
  const { appName, dependencies, onSuccess } = route.params;
  const mainAccount = getMainAccount(account, parentAccount);
  const { transaction, status } = useBridgeTransaction(() => ({
    account: mainAccount,
    transaction: route.params.transaction,
  }));
  const tokenCurrency = account.type === "TokenAccount" ? account.token : undefined;
  const handleTx = useCallback(
    (result: TransactionResult) => {
      try {
        if ("transactionSignError" in result) {
          throw result.transactionSignError;
        }

        onSuccess(result.signedOperation);

        navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>().pop();
      } catch (error) {
        if (
          !(error instanceof UserRefusedOnDevice || error instanceof TransactionRefusedOnDevice)
        ) {
          logger.critical(error as Error);
        }

        navigation.replace(ScreenName.SignTransactionValidationError, {
          ...route.params,
          error: error instanceof Error ? error : undefined,
        });
      }
    },
    [onSuccess, navigation, route.params],
  );

  const request = useMemo(
    () => ({
      account,
      parentAccount,
      appName,
      // Force transaction as the types from useBridgeTransaction
      // cannot infer the presence of transaction from the optionalInit
      // Probably something we could improve in the hook types above
      transaction: transaction!,
      status,
      tokenCurrency,
      dependencies: [
        { currency: mainAccount.currency },
        ...dependenciesToAppRequests(dependencies),
      ],
      requireLatestFirmware: true,
      isACRE: route.params.isACRE,
    }),
    [
      account,
      appName,
      dependencies,
      mainAccount.currency,
      parentAccount,
      route.params.isACRE,
      status,
      tokenCurrency,
      transaction,
    ],
  );

  const onSelectDeviceLink = useCallback(() => {
    () => {
      navigation.navigate(ScreenName.SignTransactionSelectDevice, {
        ...route.params,
        forceSelectDevice: true,
      });
    };
  }, [navigation, route.params]);

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
        request={request}
        device={route.params.device}
        onResult={handleTx}
        onSelectDeviceLink={onSelectDeviceLink}
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
