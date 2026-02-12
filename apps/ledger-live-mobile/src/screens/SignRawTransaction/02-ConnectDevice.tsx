import invariant from "invariant";
import React, { memo, useCallback, useMemo } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { dependenciesToAppRequests } from "@ledgerhq/live-common/hw/actions/app";
import { useTheme } from "@react-navigation/native";
import { TransactionResult } from "@ledgerhq/live-common/hw/actions/transaction";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { TransactionRefusedOnDevice } from "@ledgerhq/live-common/errors";
import DeviceAction from "~/components/DeviceAction";
import { TrackScreen } from "~/analytics";
import { SignRawTransactionNavigatorParamList } from "~/components/RootNavigator/types/SignRawTransactionNavigator";
import { ScreenName } from "~/const";
import type {
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import { useRawTransactionDeviceAction } from "~/hooks/deviceActions";
import logger from "~/logger";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";

export type SignRawTransactionConnectDeviceProps = StackNavigatorProps<
  SignRawTransactionNavigatorParamList,
  ScreenName.SignRawTransactionConnectDevice
>;

function ConnectDevice({ navigation, route }: SignRawTransactionConnectDeviceProps) {
  const action = useRawTransactionDeviceAction();
  const { colors } = useTheme();
  const { account, parentAccount } = useAccountScreen(route);
  invariant(account, "account is required");
  const { transaction, broadcast, appName, dependencies, onSuccess } = route.params;
  const mainAccount = getMainAccount(account, parentAccount);
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

        navigation.replace(ScreenName.SignRawTransactionValidationError, {
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
      transaction,
      broadcast,
      dependencies: [
        { currency: mainAccount.currency },
        ...dependenciesToAppRequests(dependencies),
      ],
      requireLatestFirmware: true,
    }),
    [account, appName, broadcast, dependencies, mainAccount.currency, parentAccount, transaction],
  );

  const onSelectDeviceLink = useCallback(() => {
    navigation.navigate(ScreenName.SignRawTransactionSelectDevice, {
      ...route.params,
      forceSelectDevice: true,
    });
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
        analyticsPropertyFlow="signRawTransaction"
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
