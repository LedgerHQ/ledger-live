import { findSubAccountById } from "@ledgerhq/ledger-wallet-framework/account/index";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { OperationType } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { CeloAccount, CeloOperation, CeloOperationMode, Transaction } from "../types";

const MODE_TO_TYPE: { [key in CeloOperationMode | "default"]: OperationType } = {
  send: "OUT",
  lock: "LOCK",
  unlock: "UNLOCK",
  withdraw: "WITHDRAW",
  vote: "VOTE",
  revoke: "REVOKE",
  activate: "ACTIVATE",
  register: "REGISTER",
  default: "FEES",
};

export const buildOptimisticOperation = (
  account: CeloAccount,
  transaction: Transaction,
  fee: BigNumber,
  /** What was signed: only some modes carry `transaction.feeCurrency` into the tx. */
  signed: { nonce: number; feeCurrency?: string | null | undefined },
): CeloOperation => {
  const { nonce, feeCurrency } = signed;
  const type = MODE_TO_TYPE[transaction.mode] ?? MODE_TO_TYPE.default;

  const tokenAccount = findSubAccountById(account, transaction.subAccountId || "");
  const isTokenTransaction = tokenAccount?.type === "TokenAccount";

  // A CIP-64 fee is charged in the fee currency, so it is not CELO spent.
  const isFeePaidInCelo = !isTokenTransaction && !feeCurrency;
  const celoFee = isFeePaidInCelo ? fee : 0;
  const value =
    type === "OUT" || type === "LOCK"
      ? new BigNumber(transaction.amount).plus(celoFee)
      : new BigNumber(transaction.amount);

  const operation: CeloOperation = {
    id: encodeOperationId(account.id, "", type),
    hash: "",
    type,
    value,
    fee,
    blockHash: null,
    blockHeight: null,
    // Lets the pending op clear as soon as a synced op carries the same nonce.
    transactionSequenceNumber: new BigNumber(nonce),
    senders: [account.freshAddress],
    recipients: [transaction.recipient].filter(Boolean),
    accountId: isTokenTransaction ? tokenAccount.id : account.id,
    date: new Date(),
    extra: {
      ...(["ACTIVATE", "VOTE", "REVOKE"].includes(type)
        ? {
            celoOperationValue: new BigNumber(transaction.amount),
            celoSourceValidator: transaction.recipient,
          }
        : {}),
      // Mirror what the synced path will read back from `tx.feeCurrency`, so
      // optimistic and synced ops carry the same value (adapter address for
      // non-18-decimal tokens; adapter === contract for 18-decimal tokens).
      ...(feeCurrency ? { feeCurrencyAddress: feeCurrency.toLowerCase() } : {}),
    },
  };

  return operation;
};
