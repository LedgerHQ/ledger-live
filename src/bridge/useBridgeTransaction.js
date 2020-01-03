// @flow

import { BigNumber } from "bignumber.js";
// $FlowFixMe not sure why this breaks in desktop side
import { useEffect, useReducer, useCallback, useRef } from "react";
import { log } from "@ledgerhq/logs";
import type {
  Transaction,
  TransactionStatus,
  Account,
  AccountLike
} from "../types";
import { getAccountBridge } from ".";
import { getMainAccount } from "../account";
import { delay } from "../promise";

export type State = {
  account: ?AccountLike,
  parentAccount: ?Account,
  transaction: ?Transaction,
  status: TransactionStatus,
  statusOnTransaction: ?Transaction,
  errorAccount: ?Error,
  errorStatus: ?Error
};

export type Result = {
  transaction: ?Transaction,
  setTransaction: Transaction => void,
  account: ?AccountLike,
  parentAccount: ?Account,
  setAccount: (AccountLike, ?Account) => void,
  status: TransactionStatus,
  bridgeError: ?Error,
  bridgePending: boolean
};

const initial: State = {
  account: null,
  parentAccount: null,
  transaction: null,
  status: {
    errors: {},
    warnings: {},
    estimatedFees: BigNumber(0),
    amount: BigNumber(0),
    totalSpent: BigNumber(0)
  },
  statusOnTransaction: null,
  errorAccount: null,
  errorStatus: null
};

const makeInit = (optionalInit: ?() => $Shape<State>) => (): State => {
  let s = initial;
  if (optionalInit) {
    const patch = optionalInit();
    const { account, parentAccount, transaction } = patch;
    if (account) {
      s = reducer(s, { type: "setAccount", account, parentAccount });
    }
    if (transaction) {
      s = reducer(s, { type: "setTransaction", transaction });
    }
  }
  return s;
};

const reducer = (s: State, a): State => {
  switch (a.type) {
    case "setAccount": {
      const { account, parentAccount } = a;
      try {
        const mainAccount = getMainAccount(account, parentAccount);
        const bridge = getAccountBridge(account, parentAccount);
        const subAccountId = account.type !== "Account" && account.id;
        let t = bridge.createTransaction(mainAccount);
        if (subAccountId) {
          t = { ...t, subAccountId };
        }
        return {
          ...initial,
          account,
          parentAccount,
          transaction: t
        };
      } catch (e) {
        return {
          ...initial,
          account,
          parentAccount,
          errorAccount: e
        };
      }
    }

    case "setTransaction":
      if (s.transaction === a.transaction) return s;
      return { ...s, transaction: a.transaction };

    case "onStatus":
      // if (a.transaction === s.transaction && !s.errorStatus) {
      //   return s;
      // }
      return {
        ...s,
        errorStatus: null,
        transaction: a.transaction,
        status: a.status,
        statusOnTransaction: a.transaction
      };

    case "onStatusError":
      if (a.error === s.errorStatus) return s;
      return {
        ...s,
        errorStatus: a.error
      };

    default:
      return s;
  }
};

const INITIAL_ERROR_RETRY_DELAY = 1000;
const ERROR_RETRY_DELAY_MULTIPLIER = 1.5;
const DEBOUNCED_STATUS = 300;

const useBridgeTransaction = (optionalInit?: ?() => $Shape<State>): Result => {
  const [
    {
      account,
      parentAccount,
      transaction,
      status,
      statusOnTransaction,
      errorAccount,
      errorStatus
    },
    dispatch
    // $FlowFixMe for ledger-live-mobile older react/flow version
  ] = useReducer(reducer, undefined, makeInit(optionalInit));

  const setAccount = useCallback(
    (account, parentAccount) =>
      dispatch({ type: "setAccount", account, parentAccount }),
    [dispatch]
  );

  const setTransaction = useCallback(
    transaction => dispatch({ type: "setTransaction", transaction }),
    [dispatch]
  );

  const mainAccount = account ? getMainAccount(account, parentAccount) : null;

  const errorDelay = useRef(INITIAL_ERROR_RETRY_DELAY);

  // when transaction changes, prepare the transaction
  useEffect(() => {
    let ignore = false;
    let errorTimeout;
    if (mainAccount && transaction) {
      Promise.resolve()
        .then(() => getAccountBridge(mainAccount, null))
        .then(async bridge => {
          const start = Date.now();
          const preparedTransaction = await bridge.prepareTransaction(
            mainAccount,
            transaction
          );
          if (ignore) return;
          const status = await bridge.getTransactionStatus(
            mainAccount,
            preparedTransaction
          );
          if (ignore) return;
          const delta = Date.now() - start;
          if (delta < DEBOUNCED_STATUS) {
            await delay(DEBOUNCED_STATUS - delta);
          }

          return {
            preparedTransaction,
            status
          };
        })
        .then(
          result => {
            if (ignore || !result) return;
            const { preparedTransaction, status } = result;
            errorDelay.current = INITIAL_ERROR_RETRY_DELAY; // reset delay
            dispatch({
              type: "onStatus",
              status,
              transaction: preparedTransaction
            });
          },
          e => {
            if (ignore) return;
            dispatch({ type: "onStatusError", error: e });
            log(
              "useBridgeTransaction",
              "prepareTransaction failed " + String(e)
            );
            // After X seconds of hanging in this error case, we try again
            log("useBridgeTransaction", "retrying prepareTransaction...");
            errorTimeout = setTimeout(() => {
              // $FlowFixMe (mobile)
              errorDelay.current *= ERROR_RETRY_DELAY_MULTIPLIER; // increase delay
              // $FlowFixMe
              const transactionCopy: Transaction = { ...transaction };
              dispatch({
                type: "setTransaction",
                transaction: transactionCopy
              });
              // $FlowFixMe (mobile)
            }, errorDelay.current);
          }
        );
    }
    return () => {
      ignore = true;
      if (errorTimeout) {
        clearTimeout(errorTimeout);
        errorTimeout = null;
      }
    };
  }, [transaction, mainAccount, dispatch]);

  return {
    transaction,
    setTransaction,
    status,
    account,
    parentAccount,
    setAccount,
    bridgeError: errorAccount || errorStatus,
    bridgePending: transaction !== statusOnTransaction
  };
};

export default useBridgeTransaction;
