import invariant from "invariant";
import { concat, of, from, Subscription } from "rxjs";
import { concatMap, filter } from "rxjs/operators";
import { useState, useCallback, useEffect, useRef } from "react";
import { InteractionManager, Platform } from "react-native";
import { log } from "@ledgerhq/logs";
import { useRoute, useNavigation } from "@react-navigation/native";
import type {
  Account,
  AccountLike,
  SignedOperation,
  Operation,
  BroadcastConfig,
} from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { getMainAccount } from "@ledgerhq/live-common/account/helpers";
import {
  addPendingOperation,
  formatOperation,
  formatAccount,
} from "@ledgerhq/live-common/account/index";
import {
  createTransactionBroadcastError,
  TransactionBroadcastError,
} from "@ledgerhq/live-common/errors/transactionBroadcastErrors";
import { formatTransaction } from "@ledgerhq/live-common/transaction/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { execAndWaitAtLeast } from "@ledgerhq/live-common/promise";
import { useBroadcast } from "@ledgerhq/live-common/hooks/useBroadcast";
import { broadcastLogger } from "~/datadog";
import { getEnv } from "@ledgerhq/live-env";
import { useSelector, useDispatch } from "~/context/hooks";
import { TransactionRefusedOnDevice } from "@ledgerhq/live-common/errors";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { updateAccountWithUpdater } from "../actions/accounts";
import logger from "../logger";
import { ScreenName } from "~/const";
import { urls } from "~/utils/urls";
import type {
  StackNavigatorNavigation,
  StackNavigatorRoute,
} from "../components/RootNavigator/types/helpers";
import type { SendFundsNavigatorStackParamList } from "../components/RootNavigator/types/SendFundsNavigator";
import type { SignTransactionNavigatorParamList } from "../components/RootNavigator/types/SignTransactionNavigator";
import type { AlgorandClaimRewardsFlowParamList } from "~/families/algorand/Rewards/ClaimRewardsFlow/type";
import type { StellarAddAssetFlowParamList } from "~/families/stellar/AddAssetFlow/types";
import { mevProtectionSelector } from "~/reducers/settings";
import { useNewSendFlowFeature } from "LLM/features/Send/hooks/useNewSendFlowFeature";
import type { AppDispatch } from "~/state-manager/configureStore";

type Navigation =
  | StackNavigatorNavigation<SendFundsNavigatorStackParamList, ScreenName.SendSummary>
  | StackNavigatorNavigation<SignTransactionNavigatorParamList, ScreenName.SignTransactionSummary>
  | StackNavigatorNavigation<
      AlgorandClaimRewardsFlowParamList,
      ScreenName.AlgorandClaimRewardsSummary
    >
  | StackNavigatorNavigation<StellarAddAssetFlowParamList, ScreenName.StellarAddAssetValidation>;

const shouldRestartFlow = (error: Error) => error.name === "InvalidTransactionError";

type Route =
  | StackNavigatorRoute<SendFundsNavigatorStackParamList, ScreenName.SendSummary>
  | StackNavigatorRoute<SignTransactionNavigatorParamList, ScreenName.SignTransactionSummary>
  | StackNavigatorRoute<AlgorandClaimRewardsFlowParamList, ScreenName.AlgorandClaimRewardsSummary>
  | StackNavigatorRoute<StellarAddAssetFlowParamList, ScreenName.StellarAddAssetValidation>;

const completeSignBroadcast = ({
  navigation,
  context,
  routeParams,
  mainAccount,
  operation,
  updateAccountWithUpdater,
}: {
  navigation: NativeStackNavigationProp<{ [key: string]: object }>;
  context: string;
  routeParams: Route["params"];
  mainAccount: Account;
  operation: Operation;
  updateAccountWithUpdater: (accountId: string, updater: (account: Account) => Account) => void;
}): void => {
  formatOperation(mainAccount).then(fmt =>
    log("transaction-summary", `✔️ broadcasted! optimistic operation: ${fmt(operation)}`),
  );
  navigation.replace(context + "ValidationSuccess", {
    ...routeParams,
    result: operation,
  });
  InteractionManager.runAfterInteractions(() => {
    updateAccountWithUpdater(mainAccount.id, account => addPendingOperation(account, operation));
  });
};

const completeSignedTxBroadcast = ({
  navigation,
  route,
  mainAccount,
  operation,
  dispatch,
}: {
  navigation: NativeStackNavigationProp<{ [key: string]: object }>;
  route: { name: string; params?: object };
  mainAccount: Account;
  operation: Operation;
  dispatch: AppDispatch;
}): void => {
  navigation.replace(route.name.replace("ConnectDevice", "ValidationSuccess"), {
    ...route.params,
    result: operation,
  });
  InteractionManager.runAfterInteractions(() => {
    dispatch(
      updateAccountWithUpdater({
        accountId: mainAccount.id,
        updater: account => addPendingOperation(account, operation),
      }),
    );
  });
};

export const useTransactionChangeFromNavigation = (setTransaction: (_: Transaction) => void) => {
  const route = useRoute<Route>();
  const navigationTransaction = route.params?.transaction;
  // Start at `undefined` so the first time `navigationTransaction` is set we
  // dispatch — including the case where the screen mounts (or remounts via
  // Suspense / native-stack) with the value already in route.params.
  const navigationTxRef = useRef<typeof navigationTransaction>(undefined);
  useEffect(() => {
    if (navigationTransaction && navigationTxRef.current !== navigationTransaction) {
      navigationTxRef.current = navigationTransaction;
      setTransaction(navigationTransaction);
    }
  }, [setTransaction, navigationTransaction]);
};

export const useSignWithDevice = ({
  account,
  parentAccount,
  updateAccountWithUpdater,
  context,
}: {
  context: string;
  account: AccountLike;
  parentAccount: Account | null | undefined;
  updateAccountWithUpdater: (arg0: string, arg1: (arg0: Account) => Account) => void;
}) => {
  const route = useRoute<Route>();
  const navigation = useNavigation<Navigation>();
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const subscription = useRef<null | Subscription>(null);
  const mevProtected = useSelector(mevProtectionSelector);
  const bridge = useAccountBridge(account, parentAccount);
  const signWithDevice = useCallback(() => {
    const { deviceId, transaction } = route.params || {};
    if (!transaction || !deviceId) return;
    const mainAccount = getMainAccount(account, parentAccount);

    navigation.setOptions({
      gestureEnabled: false,
    });
    setSigning(true);
    formatAccount(mainAccount, "basic").then(str => log("transaction-summary", `→ FROM ${str}`));
    log(
      "transaction-summary",
      `✔️ transaction ${formatTransaction(transaction, mainAccount)}`,
    );
    subscription.current = bridge
      .signOperation({
        account: mainAccount,
        transaction,
        deviceId,
      })
      .pipe(
        // FIXME later we will need to treat more events
        filter(e => e.type === "signed"),
        concatMap(
          (
            e, // later we will have more events
          ) =>
            concat(
              of(e),
              from(
                bridge
                  .broadcast({
                    account: mainAccount,
                    signedOperation: (e as { signedOperation: SignedOperation }).signedOperation,
                    broadcastConfig: {
                      mevProtected,
                      source: { type: "coin-module", name: "ledger-live-mobile" },
                    },
                  })
                  .then(operation => ({
                    type: "broadcasted",
                    operation,
                  })),
              ),
            ),
        ),
      )
      .subscribe({
        next: e => {
          switch (e.type) {
            case "signed":
              log(
                "transaction-summary",
                `✔️ has been signed! ${JSON.stringify(
                  (e as { signedOperation?: SignedOperation }).signedOperation,
                )}`,
              );
              setSigned(true);
              break;

            case "broadcasted":
              completeSignBroadcast({
                navigation: navigation as NativeStackNavigationProp<{ [key: string]: object }>,
                context,
                routeParams: route.params,
                mainAccount,
                operation: e.operation,
                updateAccountWithUpdater,
              });
              break;

            default:
          }
        },
        error: e => {
          let error = e;

          if (e && e.statusCode === 0x6985) {
            error = new UserRefusedOnDevice();
          } else {
            logger.critical(error);
          }

          (navigation as NativeStackNavigationProp<{ [key: string]: object }>).replace(
            context + "ValidationError",
            {
              ...route.params,
              error,
            },
          );
        },
      });
  }, [
    context,
    account,
    bridge,
    navigation,
    parentAccount,
    updateAccountWithUpdater,
    route.params,
    mevProtected,
  ]);
  useEffect(() => {
    signWithDevice();
    return () => {
      navigation.setOptions({
        gestureEnabled: Platform.OS === "ios",
      });

      if (subscription.current) {
        subscription.current.unsubscribe();
      }
    }; // only this effect on mount
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return [signing, signed];
};
type SignTransactionArgs = {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  broadcastConfig?: BroadcastConfig;
};
export const broadcastSignedTx = async (
  account: AccountLike,
  parentAccount: Account | null | undefined,
  signedOperation: SignedOperation,
  broadcastConfig?: BroadcastConfig,
): Promise<Operation> => {
  invariant(account, "account not present");
  const mainAccount = getMainAccount(account, parentAccount);
  const bridge = await getAccountBridge(account, parentAccount);

  if (getEnv("DISABLE_TRANSACTION_BROADCAST")) {
    return Promise.resolve(signedOperation.operation);
  }

  return execAndWaitAtLeast(3000, () =>
    bridge
      .broadcast({
        account: mainAccount,
        signedOperation,
        broadcastConfig,
      })
      .then(async op => {
        log(
          "transaction-summary",
          `✔️ broadcasted! optimistic operation: ${(await formatOperation(mainAccount))(op)}`,
        );
        return op;
      }),
  );
};

export function useSignedTxHandler({
  account,
  parentAccount,
}: SignTransactionArgs & {
  account: AccountLike;
  parentAccount: Account | null | undefined;
}) {
  const mevProtected = useSelector(mevProtectionSelector);
  const navigation = useNavigation();
  const route = useRoute();
  const mainAccount = getMainAccount(account, parentAccount);
  const { isEnabledForFamily } = useNewSendFlowFeature();
  const newSendFlow = isEnabledForFamily(mainAccount.currency.family, mainAccount.currency.id);
  const broadcast = useBroadcast({
    account,
    parentAccount,
    broadcastConfig: {
      mevProtected,
      source: { type: "coin-module", name: "ledger-live-mobile", flags: { newSendFlow } },
    },
    logger: broadcastLogger,
  });
  const dispatch = useDispatch();
  return useCallback(
    // TODO: fix type error

    async ({
      signedOperation,
      transactionSignError,
    }: {
      signedOperation: SignedOperation;
      transactionSignError?: Error;
    }) => {
      try {
        if (transactionSignError) {
          throw transactionSignError;
        }

        const operation = await broadcast(signedOperation).catch((err: Error) => {
          if (shouldRestartFlow(err)) {
            throw err;
          }
          const currency = mainAccount.currency;
          throw createTransactionBroadcastError(err, urls, {
            network: currency.name,
            coin: currency.ticker,
          });
        });

        log(
          "transaction-summary",
          `✔️ broadcasted! optimistic operation: ${(await formatOperation(mainAccount))(operation)}`,
        );
        completeSignedTxBroadcast({
          navigation: navigation as NativeStackNavigationProp<{ [key: string]: object }>,
          route,
          mainAccount,
          operation,
          dispatch,
        });
      } catch (error) {
        if (
          !(error instanceof UserRefusedOnDevice || error instanceof TransactionRefusedOnDevice)
        ) {
          logger.critical(error as Error);
        }

        if (
          error instanceof TransactionBroadcastError &&
          route.name === ScreenName.SendConnectDevice
        ) {
          return (navigation as NativeStackNavigationProp<{ [key: string]: object }>).replace(
            ScreenName.SendBroadcastError,
            { ...route.params, error },
          );
        }

        (navigation as NativeStackNavigationProp<{ [key: string]: object }>).replace(
          route.name.replace("ConnectDevice", "ValidationError"),
          { ...route.params, error },
        );
      }
    },
    [navigation, route, broadcast, mainAccount, dispatch],
  );
}
