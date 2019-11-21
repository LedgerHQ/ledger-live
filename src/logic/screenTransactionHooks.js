/* @flow */

import { useState, useCallback, useEffect, useRef } from "react";
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

export const useTransactionChangeFromNavigation = ({
  navigation,
  setTransaction,
}: {
  navigation: *,
  setTransaction: Transaction => void,
}) => {
  const navigationTransaction = navigation.getParam("transaction");
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
  navigation,
  updateAccountWithUpdater,
  context,
}: {
  context: string,
  account: AccountLike,
  parentAccount: ?Account,
  navigation: *,
  updateAccountWithUpdater: (string, (Account) => Account) => void,
}) => {
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const subscription = useRef(null);

  const signWithDevice = useCallback(() => {
    const deviceId = navigation.getParam("deviceId");
    const transaction = navigation.getParam("transaction");
    const bridge = getAccountBridge(account, parentAccount);
    const mainAccount = getMainAccount(account, parentAccount);

    const n = navigation.dangerouslyGetParent();
    if (n) n.setParams({ allowNavigation: false });
    setSigning(true);

    subscription.current = bridge
      .signAndBroadcast(mainAccount, transaction, deviceId)
      .subscribe({
        next: e => {
          switch (e.type) {
            case "signed":
              setSigned(true);
              break;

            case "broadcasted":
              // $FlowFixMe
              navigation.replace(context + "ValidationSuccess", {
                ...navigation.state.params,
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
          // $FlowFixMe
          navigation.replace(context + "ValidationError", {
            ...navigation.state.params,
            error,
          });
        },
      });
  }, [context, account, navigation, parentAccount, updateAccountWithUpdater]);

  useEffect(() => {
    signWithDevice();
    return () => {
      const n = navigation.dangerouslyGetParent();
      if (n) n.setParams({ allowNavigation: true });
      if (subscription.current) {
        subscription.current.unsubscribe();
      }
    };
    // only this effect on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [signing, signed];
};
