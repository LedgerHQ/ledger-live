import { BigNumber } from "bignumber.js";
import { useEffect, useReducer, useCallback, useRef } from "react";
import { log } from "@ledgerhq/logs";
import { getAccountBridge } from ".";
import { getMainAccount } from "../account";
import { delay } from "../promise";
import type { Account, AccountBridge, AccountLike } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "../generated/types";

export type State<T extends Transaction = Transaction> = {
  account: AccountLike | null | undefined;
  parentAccount: Account | null | undefined;
  transaction: T | null | undefined;
  status: TransactionStatus;
  statusOnTransaction: T | null | undefined;
  errorAccount: Error | null | undefined;
  errorStatus: Error | null | undefined;
};

export type Result<T extends Transaction = Transaction> = {
  transaction: T | null | undefined;
  setTransaction: (arg0: T) => void;
  updateTransaction: (updater: (arg0: T) => T) => void;
  account: AccountLike | null | undefined;
  parentAccount: Account | null | undefined;
  setAccount: (arg0: AccountLike, arg1: Account | null | undefined) => void;
  status: TransactionStatus;
  bridgeError: Error | null | undefined;
  bridgePending: boolean;
};

type Actions<T extends Transaction = Transaction> =
  | {
      type: "setAccount";
      account: AccountLike;
      parentAccount: Account | null | undefined;
    }
  | {
      type: "setTransaction";
      transaction: T;
    }
  | {
      type: "updateTransaction";
      updater: (transaction: T) => T;
    }
  | {
      type: "onStatus";
      status: TransactionStatus;
      transaction: T;
    }
  | {
      type: "onStatusError";
      error: Error;
    }
  | {
      type: "setTransaction";
      transaction: T;
    };

type Reducer<T extends Transaction = Transaction> = (
  state: State<T>,
  action: Actions<T>,
) => State<T>;

const initial: State<Transaction> = {
  account: null,
  parentAccount: null,
  transaction: null,
  status: {
    errors: {},
    warnings: {},
    estimatedFees: new BigNumber(0),
    amount: new BigNumber(0),
    totalSpent: new BigNumber(0),
  },
  statusOnTransaction: null,
  errorAccount: null,
  errorStatus: null,
};

const makeInit =
  <T extends Transaction = Transaction>(
    optionalInit: (() => Partial<State<T>>) | null | undefined,
  ) =>
  (): State<T> => {
    let s = initial as State<T>;

    if (optionalInit) {
      const patch = optionalInit();
      const { account, parentAccount, transaction } = patch;

      if (account) {
        s = (reducer as Reducer<T>)(s, {
          type: "setAccount",
          account,
          parentAccount,
        });
      }

      if (transaction) {
        s = (reducer as Reducer<T>)(s, {
          type: "setTransaction",
          transaction,
        });
      }
    }

    return s;
  };

const reducer = <T extends Transaction = Transaction>(
  state: State<T>,
  action: Actions<T>,
): State<T> => {
  switch (action.type) {
    case "setAccount": {
      const { account, parentAccount } = action;

      try {
        const mainAccount = getMainAccount(account, parentAccount);
        const bridge = getAccountBridge(account, parentAccount) as AccountBridge<T>;
        const subAccountId = account.type !== "Account" && account.id;
        let t = bridge.createTransaction(mainAccount);
        if (
          // @ts-expect-error transaction.mode is not available on all union types. type guard is required
          state.transaction?.mode &&
          // @ts-expect-error transaction.mode is not available on all union types. type guard is required
          state.transaction.mode !== t.mode
        ) {
          t = bridge.updateTransaction(t, {
            // @ts-expect-error transaction.mode is not available on all union types. type guard is required
            mode: state.transaction.mode,
          });
        }

        if (subAccountId) {
          t = { ...t, subAccountId };
        }

        return {
          ...initial,
          account,
          parentAccount,
          transaction: t,
        } as State<T>;
      } catch (e: any) {
        return {
          ...initial,
          account,
          parentAccount,
          errorAccount: e,
        } as State<T>;
      }
    }

    case "setTransaction":
      if (state.transaction === action.transaction) return state;
      return { ...state, transaction: action.transaction };

    case "updateTransaction": {
      if (!state.transaction) return state;
      const transaction = action.updater(state.transaction);
      if (state.transaction === transaction) return state;
      return { ...state, transaction };
    }

    case "onStatus":
      return {
        ...state,
        errorStatus: null,
        transaction: action.transaction,
        status: action.status,
        statusOnTransaction: action.transaction,
      };

    case "onStatusError":
      if (action.error === state.errorStatus) return state;
      return { ...state, errorStatus: action.error };

    default:
      return state;
  }
};

const INITIAL_ERROR_RETRY_DELAY = 1000;
const ERROR_RETRY_DELAY_MULTIPLIER = 1.5;
const DEBOUNCE_STATUS_DELAY = 300;

const useBridgeTransaction = <T extends Transaction = Transaction>(
  optionalInit?: (() => Partial<State<T>>) | null | undefined,
): Result<T> => {
  const [
    { account, parentAccount, transaction, status, statusOnTransaction, errorAccount, errorStatus },
    dispatch, // $FlowFixMe for ledger-live-mobile older react/flow version
  ] = useReducer(reducer as Reducer<T>, undefined, makeInit<T>(optionalInit));
  const setAccount = useCallback(
    (account, parentAccount) =>
      dispatch({
        type: "setAccount",
        account,
        parentAccount,
      }),
    [dispatch],
  );
  const setTransaction = useCallback(
    transaction =>
      dispatch({
        type: "setTransaction",
        transaction,
      }),
    [dispatch],
  );
  const updateTransaction = useCallback(
    updater =>
      dispatch({
        type: "updateTransaction",
        updater,
      }),
    [dispatch],
  );
  const mainAccount = account ? getMainAccount(account, parentAccount) : null;
  const errorDelay = useRef(INITIAL_ERROR_RETRY_DELAY);
  const statusIsPending = useRef(false); // Stores if status already being processed

  const bridgePending = transaction !== statusOnTransaction;
  // when transaction changes, prepare the transaction
  useEffect(() => {
    let ignore = false;
    let errorTimeout;
    // If bridge is not pending, transaction change is due to
    // the last onStatus dispatch (prepareTransaction changed original transaction) and must be ignored
    if (!bridgePending) return;

    if (mainAccount && transaction) {
      // We don't debounce first status refresh, but any subsequent to avoid multiple calls
      // First call is immediate
      const debounce = statusIsPending.current ? delay(DEBOUNCE_STATUS_DELAY) : null;
      statusIsPending.current = true; // consider pending until status is resolved (error or success)

      Promise.resolve(debounce)
        .then(() => getAccountBridge(mainAccount, null))
        .then(async bridge => {
          if (ignore) return;
          const preparedTransaction = await bridge.prepareTransaction(mainAccount, transaction);
          if (ignore) return;
          const status = await bridge.getTransactionStatus(mainAccount, preparedTransaction);
          if (ignore) return;
          return {
            preparedTransaction,
            status,
          };
        })
        .then(
          result => {
            if (ignore || !result) return;
            const { preparedTransaction, status } = result;
            errorDelay.current = INITIAL_ERROR_RETRY_DELAY; // reset delay

            statusIsPending.current = false; // status is now synced with transaction

            dispatch({
              type: "onStatus",
              status,
              transaction: preparedTransaction,
            });
          },
          e => {
            if (ignore) return;
            statusIsPending.current = false;
            dispatch({
              type: "onStatusError",
              error: e,
            });
            log("useBridgeTransaction", "prepareTransaction failed " + String(e));
            // After X seconds of hanging in this error case, we try again
            log("useBridgeTransaction", "retrying prepareTransaction...");
            errorTimeout = setTimeout(() => {
              // $FlowFixMe (mobile)
              errorDelay.current *= ERROR_RETRY_DELAY_MULTIPLIER; // increase delay

              // $FlowFixMe
              const transactionCopy = {
                ...transaction,
              };
              dispatch({
                type: "setTransaction",
                transaction: transactionCopy,
              }); // $FlowFixMe (mobile)
            }, errorDelay.current);
          },
        );
    }

    return () => {
      ignore = true;

      if (errorTimeout) {
        clearTimeout(errorTimeout);
        errorTimeout = null;
      }
    };
  }, [transaction, mainAccount, bridgePending, dispatch]);

  const bridgeError = errorAccount || errorStatus;

  useEffect(() => {
    if (bridgeError && globalOnBridgeError) {
      globalOnBridgeError(bridgeError);
    }
  }, [bridgeError]);

  return {
    transaction,
    setTransaction,
    updateTransaction,
    status,
    account,
    parentAccount,
    setAccount,
    bridgeError,
    bridgePending,
  };
};

type GlobalBridgeErrorFn = null | ((error: any) => void);

let globalOnBridgeError: GlobalBridgeErrorFn = null;

// allows to globally set a bridge error catch function in order to log it / report to sentry / ...
export function setGlobalOnBridgeError(f: GlobalBridgeErrorFn): void {
  globalOnBridgeError = f;
}
export function getGlobalOnBridgeError(): GlobalBridgeErrorFn {
  return globalOnBridgeError;
}

export default useBridgeTransaction;
