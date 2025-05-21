import { BigNumber } from "bignumber.js";
import { apiProxy } from "../_utils";
import { useState } from "react";

export default function useBridgeTransaction(init): Record<string, unknown> {
  const [initialValue] = useState(init ?? {});
  // {
  //   account: initialAccount,
  //   transaction: initialTransaction,
  //   parentAccount,
  //   status: InitialStatus,
  //   // statusOnTransaction,
  //   // errorAccount,
  //   // errorStatus,
  // }
  console.log(initialValue.account);
  // account = initialAccount ?? account;
  // transaction = initialTransaction ?? transaction;

  const [account, setAccount] = useState(initialValue.account);
  const [parentAccount, setParentAccount] = useState(initialValue.account);
  const [transaction, setTransaction] = useState(
    initialValue.transaction ??
      apiProxy("Transaction", {
        feePerByte: new BigNumber(1),
        networkInfo: null,
        family: (account.currency ?? parentAccount.curency)?.family,
      }),
  );
  const [status] = useState(
    initialValue.status ??
      apiProxy("TransactionStatus", {
        amount: new BigNumber(1000),
        totalSpent: new BigNumber(1000),
      }),
  );
  let updater = (t: object) => t;

  return {
    ...initialValue,
    account,
    parentAccount,
    setAccount: (account: object, parentAccount: object) => {
      if (account) setAccount(account);
      if (parentAccount) setParentAccount(parentAccount);
    },
    transaction,
    setTransaction: (transaction: object) => {
      console.log("CALL set transaction with", transaction);
      if (transaction) setTransaction(transaction);
    },
    updateTransaction: (u: (t: object) => object) => {
      updater = u;
    },
    status,
    bridgeError: null,
    bridgePending: false,
  };
}
