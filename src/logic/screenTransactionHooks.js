/* @flow */

import { concat, of, from } from "rxjs";
import { concatMap, filter } from "rxjs/operators";
import { useState, useCallback, useEffect, useRef } from "react";
import { Platform } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import type {
  Account,
  AccountLike,
  Transaction,
} from "@ledgerhq/live-common/lib/types";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { getMainAccount } from "@ledgerhq/live-common/lib/account/helpers";
import { addPendingOperation } from "@ledgerhq/live-common/lib/account";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
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
              setSigned(true);
              break;

            case "broadcasted":
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
