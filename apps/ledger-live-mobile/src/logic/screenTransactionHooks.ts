import invariant from "invariant";
import { concat, of, from, Subscription } from "rxjs";
import { concatMap, filter } from "rxjs/operators";
import { useState, useCallback, useEffect, useRef } from "react";
import { Platform } from "react-native";
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
import { execAndWaitAtLeast } from "@ledgerhq/live-common/promise";
import { getEnv } from "@ledgerhq/live-env";
import { useDispatch, useSelector } from "react-redux";
import { TransactionRefusedOnDevice } from "@ledgerhq/live-common/errors";
import { StackNavigationProp } from "@react-navigation/stack";
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

type Navigation =
  | StackNavigatorNavigation<SendFundsNavigatorStackParamList, ScreenName.SendSummary>
  | StackNavigatorNavigation<SignTransactionNavigatorParamList, ScreenName.SignTransactionSummary>
  | StackNavigatorNavigation<
      AlgorandClaimRewardsFlowParamList,
      ScreenName.AlgorandClaimRewardsSummary
    >
  | StackNavigatorNavigation<StellarAddAssetFlowParamList, ScreenName.StellarAddAssetValidation>;

type Route =
  | StackNavigatorRoute<SendFundsNavigatorStackParamList, ScreenName.SendSummary>
  | StackNavigatorRoute<SignTransactionNavigatorParamList, ScreenName.SignTransactionSummary>
  | StackNavigatorRoute<AlgorandClaimRewardsFlowParamList, ScreenName.AlgorandClaimRewardsSummary>
  | StackNavigatorRoute<StellarAddAssetFlowParamList, ScreenName.StellarAddAssetValidation>;

export const useTransactionChangeFromNavigation = (setTransaction: (_: Transaction) => void) => {
  const route = useRoute<Route>();
  const navigationTransaction = route.params?.transaction;
  const navigationTxRef = useRef(navigationTransaction);
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
  const signWithDevice = useCallback(() => {
    const { deviceId, transaction } = route.params || {};
    const bridge = getAccountBridge(account, parentAccount);
    const mainAccount = getMainAccount(account, parentAccount);

    navigation.setOptions({
      gestureEnabled: false,
    });
    setSigning(true);
    log("transaction-summary", `→ FROM ${formatAccount(mainAccount, "basic")}`);
    log(
      "transaction-summary",
      `✔️ transaction ${transaction && formatTransaction(transaction, mainAccount)}`,
    );
    subscription.current = bridge
      .signOperation({
        account: mainAccount,
        transaction,
        // FIXME: deviceId could be undefined apparently
        deviceId: deviceId!,
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
                    broadcastConfig: { mevProtected },
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
              log(
                "transaction-summary",
                `✔️ broadcasted! optimistic operation: ${formatOperation(mainAccount)(
                  e.operation,
                )}`,
              );
              (navigation as StackNavigationProp<{ [key: string]: object }>).replace(
                context + "ValidationSuccess",
                {
                  ...route.params,
                  result: e.operation,
                },
              );
              updateAccountWithUpdater(mainAccount.id, account =>
                addPendingOperation(account, e.operation),
              );
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

          (navigation as StackNavigationProp<{ [key: string]: object }>).replace(
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  const bridge = getAccountBridge(account, parentAccount);

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
      .then(op => {
        log(
          "transaction-summary",
          `✔️ broadcasted! optimistic operation: ${formatOperation(mainAccount)(op)}`,
        );
        return op;
      }),
  );
};

// TODO move to live-common
function useBroadcast({ account, parentAccount, broadcastConfig }: SignTransactionArgs) {
  return useCallback(
    async (signedOperation: SignedOperation): Promise<Operation> =>
      broadcastSignedTx(account, parentAccount, signedOperation, broadcastConfig),
    [account, parentAccount, broadcastConfig],
  );
}

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
  const broadcast = useBroadcast({
    account,
    parentAccount,
    broadcastConfig: { mevProtected },
  });
  const dispatch = useDispatch();
  const mainAccount = getMainAccount(account, parentAccount);
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
          const currency = mainAccount.currency;
          throw createTransactionBroadcastError(err, urls, {
            network: currency.name,
            coin: currency.ticker,
          });
        });

        log(
          "transaction-summary",
          `✔️ broadcasted! optimistic operation: ${formatOperation(mainAccount)(operation)}`,
        );
        (navigation as StackNavigationProp<{ [key: string]: object }>).replace(
          route.name.replace("ConnectDevice", "ValidationSuccess"),
          { ...route.params, result: operation },
        );
        dispatch(
          updateAccountWithUpdater({
            accountId: mainAccount.id,
            updater: account => addPendingOperation(account, operation),
          }),
        );
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
          return (navigation as StackNavigationProp<{ [key: string]: object }>).replace(
            ScreenName.SendBroadcastError,
            { ...route.params, error },
          );
        }

        (navigation as StackNavigationProp<{ [key: string]: object }>).replace(
          route.name.replace("ConnectDevice", "ValidationError"),
          { ...route.params, error },
        );
      }
    },
    [navigation, route, broadcast, mainAccount, dispatch],
  );
}
