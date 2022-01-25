/* @flow */
import invariant from "invariant";
import { concat, of, from } from "rxjs";
import { concatMap, filter } from "rxjs/operators";
import { useState, useCallback, useEffect, useRef } from "react";
import { Platform } from "react-native";
import { log } from "@ledgerhq/logs";
import { useRoute, useNavigation } from "@react-navigation/native";
import type {
  Account,
  AccountLike,
  Transaction,
  SignedOperation,
  Operation,
} from "@ledgerhq/live-common/lib/types";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { getMainAccount } from "@ledgerhq/live-common/lib/account/helpers";
import {
  addPendingOperation,
  formatOperation,
  formatAccount,
} from "@ledgerhq/live-common/lib/account";
import { formatTransaction } from "@ledgerhq/live-common/lib/transaction";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import { execAndWaitAtLeast } from "@ledgerhq/live-common/lib/promise";
import { getEnv } from "@ledgerhq/live-common/lib/env";
import { useDispatch } from "react-redux";
import { TransactionRefusedOnDevice } from "@ledgerhq/live-common/lib/errors";
import { updateAccountWithUpdater } from "../actions/accounts";
import logger from "../logger";

export const useTransactionChangeFromNavigation = (
  setTransaction: Transaction => void,
) => {
  const route = useRoute();
  const navigationTransaction = route.params?.transaction;
  const navigationTxRef = useRef(navigationTransaction);
  useEffect(() => {
    if (navigationTxRef.current !== navigationTransaction) {
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
  context: string,
  account: AccountLike,
  parentAccount: ?Account,
  updateAccountWithUpdater: (string, (Account) => Account) => void,
}) => {
  const route = useRoute();
  const navigation = useNavigation();
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const subscription = useRef(null);

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
      `✔️ transaction ${formatTransaction(transaction, mainAccount)}`,
    );

    subscription.current = bridge
      .signOperation({ account: mainAccount, transaction, deviceId })
      .pipe(
        // FIXME later we will need to treat more events
        filter(e => e.type === "signed"),
        concatMap(e =>
          // later we will have more events
          concat(
            of(e),
            from(
              bridge
                .broadcast({
                  account: mainAccount,
                  signedOperation: e.signedOperation,
                })
                .then(operation => ({ type: "broadcasted", operation })),
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
                `✔️ has been signed! ${JSON.stringify(e.signedOperation)}`,
              );
              setSigned(true);
              break;

            case "broadcasted":
              log(
                "transaction-summary",
                `✔️ broadcasted! optimistic operation: ${formatOperation(
                  mainAccount,
                )(e.operation)}`,
              );
              navigation.replace(context + "ValidationSuccess", {
                ...route.params,
                result: e.operation,
              });
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
          navigation.replace(context + "ValidationError", {
            ...route.params,
            error,
          });
        },
      });
  }, [
    context,
    account,
    navigation,
    parentAccount,
    updateAccountWithUpdater,
    route.params,
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
    };
    // only this effect on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [signing, signed];
};

type SignTransactionArgs = {
  account: AccountLike,
  parentAccount: ?Account,
};

export const broadcastSignedTx = async (
  account: AccountLike,
  parentAccount: ?Account,
  signedOperation: SignedOperation,
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
      })
      .then(op => {
        log(
          "transaction-summary",
          `✔️ broadcasted! optimistic operation: ${formatOperation(mainAccount)(
            op,
          )}`,
        );
        return op;
      }),
  );
};

// TODO move to live-common
function useBroadcast({ account, parentAccount }: SignTransactionArgs) {
  return useCallback(
    async (signedOperation: SignedOperation): Promise<Operation> =>
      broadcastSignedTx(account, parentAccount, signedOperation),
    [account, parentAccount],
  );
}

export function useSignedTxHandler({
  account,
  parentAccount,
}: SignTransactionArgs & {
  account: AccountLike,
  parentAccount: ?Account,
}) {
  const navigation = useNavigation();
  const route = useRoute();
  const broadcast = useBroadcast({ account, parentAccount });
  const dispatch = useDispatch();
  const mainAccount = getMainAccount(account, parentAccount);

  return useCallback(
    // TODO: fix type error
    // $FlowFixMe
    async ({ signedOperation, transactionSignError }) => {
      try {
        if (transactionSignError) {
          throw transactionSignError;
        }

        const operation = await broadcast(signedOperation);

        log(
          "transaction-summary",
          `✔️ broadcasted! optimistic operation: ${formatOperation(mainAccount)(
            operation,
          )}`,
        );

        navigation.replace(
          route.name.replace("ConnectDevice", "ValidationSuccess"),
          {
            ...route.params,
            result: operation,
          },
        );
        dispatch(
          updateAccountWithUpdater(mainAccount.id, account =>
            addPendingOperation(account, operation),
          ),
        );
      } catch (error) {
        if (
          !(
            error instanceof UserRefusedOnDevice ||
            error instanceof TransactionRefusedOnDevice
          )
        ) {
          logger.critical(error);
        }
        navigation.replace(
          route.name.replace("ConnectDevice", "ValidationError"),
          {
            ...route.params,
            error,
          },
        );
      }
    },
    [navigation, route, broadcast, mainAccount, dispatch],
  );
}

export function useSignedTxHandlerWithoutBroadcast({
  onSuccess,
}: {
  onSuccess: (signedOp: *) => void,
}) {
  const navigation = useNavigation();
  const route = useRoute();

  return useCallback(
    // TODO: fix type error
    // $FlowFixMe
    async ({ signedOperation, transactionSignError }) => {
      try {
        if (transactionSignError) {
          throw transactionSignError;
        }

        onSuccess({ signedOperation });
      } catch (error) {
        if (
          !(
            error instanceof UserRefusedOnDevice ||
            error instanceof TransactionRefusedOnDevice
          )
        ) {
          logger.critical(error);
        }
        navigation.replace(
          route.name.replace("ConnectDevice", "ValidationError"),
          { ...route.params, error },
        );
      }
    },
    [onSuccess, navigation, route.name, route.params],
  );
}
