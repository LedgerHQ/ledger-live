import invariant from "invariant";
import React, { useCallback, useMemo } from "react";
import { StyleSheet } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Edge, SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { log } from "@ledgerhq/logs";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { getMainAccount } from "@ledgerhq/live-common/account/helpers";
import { addPendingOperation, formatOperation } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { execAndWaitAtLeast } from "@ledgerhq/live-common/promise";
import { getEnv } from "@ledgerhq/live-env";
import { TransactionRefusedOnDevice } from "@ledgerhq/live-common/errors";
import type { SignedOperation, Account } from "@ledgerhq/types-live";
import type { ICPAccount } from "@ledgerhq/live-common/families/internet_computer/types";
import type { NeuronsData } from "@zondax/ledger-live-icp/neurons";

import { accountScreenSelector } from "~/reducers/accounts";
import DeviceAction from "~/components/DeviceAction";
import { renderLoading } from "~/components/DeviceAction/rendering";
import { TrackScreen } from "~/analytics";
import { ScreenName } from "~/const";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { updateAccountWithUpdater } from "~/actions/accounts";
import logger from "~/logger";
import { useTransactionDeviceAction } from "~/hooks/deviceActions";
import { mevProtectionSelector } from "~/reducers/settings";

import type { InternetComputerNeuronManageFlowParamList } from "./types";

type Props = BaseComposite<
  StackNavigatorProps<
    InternetComputerNeuronManageFlowParamList,
    ScreenName.InternetComputerNeuronConnectDevice
  >
>;

export const navigateToSelectDevice = (navigation: Props["navigation"], route: Props["route"]) =>
  (navigation as NativeStackNavigationProp<{ [key: string]: object }>).navigate(
    ScreenName.InternetComputerNeuronSelectDevice,
    {
      ...route.params,
      forceSelectDevice: true,
    },
  );

export default function ConnectDevice({ route, navigation }: Props) {
  const action = useTransactionDeviceAction();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  const mevProtected = useSelector(mevProtectionSelector);

  invariant(account, "account is required");

  const { appName, transaction, status, analyticsPropertyFlow, source } = route.params;
  const tokenCurrency = account.type === "TokenAccount" ? account.token : undefined;
  const mainAccount = getMainAccount(account, parentAccount) as ICPAccount;
  const bridge = getAccountBridge(account, parentAccount);

  const isListNeurons = transaction?.type === "list_neurons";

  const handleTx = useCallback(
    (payload: { signedOperation: SignedOperation; transactionSignError?: Error }) => {
      const processTransaction = async () => {
        try {
          if (payload.transactionSignError) {
            throw payload.transactionSignError;
          }

          let operation;
          if (getEnv("DISABLE_TRANSACTION_BROADCAST")) {
            operation = payload.signedOperation.operation;
          } else {
            operation = await execAndWaitAtLeast(3000, () =>
              bridge.broadcast({
                account: mainAccount,
                signedOperation: payload.signedOperation,
                broadcastConfig: { mevProtected },
              }),
            );
          }

          log(
            "transaction-summary",
            `✔️ broadcasted! optimistic operation: ${formatOperation(mainAccount)(operation)}`,
          );

          if (isListNeurons) {
            // For list_neurons, update account neurons directly without passing through navigation
            // This avoids serialization issues with NeuronsData (contains BigInt, typed arrays)
            const extra = operation.extra as { neurons?: NeuronsData } | undefined;
            const neurons = extra?.neurons;

            if (neurons) {
              dispatch(
                updateAccountWithUpdater({
                  accountId: mainAccount.id,
                  updater: (acc: Account) => ({
                    ...acc,
                    neurons,
                  }),
                }),
              );
            }

            // Navigate to success without the operation result (which contains non-serializable neurons)
            (navigation as NativeStackNavigationProp<{ [key: string]: object }>).replace(
              ScreenName.InternetComputerNeuronValidationSuccess,
              {
                accountId: route.params.accountId,
                transaction,
                source,
                // Don't pass result for list_neurons to avoid serialization errors
              },
            );
          } else {
            // For other transaction types, add pending operation and navigate normally
            dispatch(
              updateAccountWithUpdater({
                accountId: mainAccount.id,
                updater: (acc: Account) => addPendingOperation(acc, operation),
              }),
            );

            (navigation as NativeStackNavigationProp<{ [key: string]: object }>).replace(
              ScreenName.InternetComputerNeuronValidationSuccess,
              {
                ...route.params,
                result: operation,
              },
            );
          }
        } catch (error) {
          if (
            !(error instanceof UserRefusedOnDevice || error instanceof TransactionRefusedOnDevice)
          ) {
            logger.critical(error as Error);
          }

          (navigation as NativeStackNavigationProp<{ [key: string]: object }>).replace(
            ScreenName.InternetComputerNeuronValidationError,
            {
              ...route.params,
              error: error as Error,
            },
          );
        }
      };

      // Start async processing
      processTransaction();

      // Return loading UI synchronously
      return renderLoading({ t });
    },
    [
      bridge,
      mainAccount,
      mevProtected,
      isListNeurons,
      dispatch,
      navigation,
      route.params,
      transaction,
      source,
      t,
    ],
  );

  return useMemo(
    () =>
      transaction ? (
        <SafeAreaView
          edges={edges}
          style={[
            styles.root,
            {
              backgroundColor: colors.background.main,
            },
          ]}
        >
          <TrackScreen
            category="ICP Neuron Management"
            name="ConnectDevice"
            flow="manage"
            action={transaction?.type || "neuron_management"}
            currency="internet_computer"
          />
          <DeviceAction
            // @ts-expect-error DeviceAction has complex generics that don't align perfectly
            action={action}
            request={{
              account,
              parentAccount,
              appName,
              transaction,
              status,
              tokenCurrency,
            }}
            device={route.params.device}
            onSelectDeviceLink={() => navigateToSelectDevice(navigation, route)}
            renderOnResult={handleTx}
            analyticsPropertyFlow={analyticsPropertyFlow}
          />
        </SafeAreaView>
      ) : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [status, transaction, tokenCurrency, route.params.device],
  );
}

const edges = ["bottom"] as Edge[];

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 16,
  },
});
