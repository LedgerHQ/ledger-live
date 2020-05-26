// @flow
import type { Account, Operation, Transaction } from "../types";
import { isAccountEmpty, getAccountUnit, formatAccount } from "../account";
import {
  toSignedOperationRaw,
  formatTransaction,
  formatTransactionStatus,
} from "../transaction";
import { formatCurrencyUnit } from "../currencies";
import { getOperationAmountNumber } from "../operation";
import type { MutationReport } from "./types";

const formatTime = (t) =>
  t > 3000
    ? `${Math.round(t / 100) / 10}s`
    : `${t < 5 ? t.toFixed(2) : t.toFixed(0)}ms`;

const formatDt = (from, to) => (from && to ? formatTime(to - from) : "?");

const formatOp = (account: ?Account) => {
  const unitByAccountId = (id: string) => {
    if (!account) return;
    if (account.id === id) return account.unit;
    const ta = (account.subAccounts || []).find((a) => a.id === id);
    if (ta) return getAccountUnit(ta);
  };

  const format = (op: Operation, level = 0) => {
    const unit = unitByAccountId(op.accountId);
    const amountBN = getOperationAmountNumber(op);
    const amount = unit
      ? formatCurrencyUnit(unit, amountBN, {
          showCode: true,
          alwaysShowSign: true,
        })
      : "? " + amountBN.toString();
    const spaces = Array((level + 1) * 2)
      .fill(" ")
      .join("");
    const extra = level > 0 ? "" : `${op.hash}     ${op.date.toISOString()}`;
    const head = `${(spaces + amount).padEnd(20)} ${op.type.padEnd(
      11
    )}${extra}`;
    const sub = (op.subOperations || [])
      .concat(op.internalOperations || [])
      .map((subop) => format(subop, level + 1))
      .join("");
    return `\n${head}${sub}`;
  };
  return (op) => format(op, 0);
};

export function formatReportForConsole<T: Transaction>({
  spec,
  appCandidate,
  account,
  unavailableMutationReasons,
  mutation,
  destination,
  transaction,
  statusTime,
  status,
  signedOperation,
  signedTime,
  optimisticOperation,
  broadcastedTime,
  operation,
  confirmedTime,
  finalAccount,
  error,
}: MutationReport<T>) {
  let str = "";
  str += `(spec '${spec.name}')\n`;
  str += `▬ app ${appCandidate.appName} ${appCandidate.appVersion} on ${appCandidate.model} ${appCandidate.firmware}\n`;
  if (account) {
    str += `→ FROM ${formatAccount(account, "summary")}\n`;
  }
  if (unavailableMutationReasons) {
    const detail =
      account && isAccountEmpty(account)
        ? "account is empty"
        : unavailableMutationReasons.join(", ");
    str += `🤷‍♂️ couldn't find a mutation to do! (${detail})\n`;
  }
  if (mutation) {
    str += `★ using mutation '${mutation.name}'\n`;
  }
  if (destination) {
    str += `→ TO ${formatAccount(destination, "summary")}\n`;
  }
  if (transaction && account) {
    str += `✔️ doing transaction ${formatTransaction(transaction, account)}\n`;
  }
  if (status && transaction && account) {
    str += `with transaction status: ${formatTransactionStatus(
      transaction,
      status,
      account
    )}\n`;
  }
  if (signedOperation) {
    str += `✔️ has been signed! (${formatDt(statusTime, signedTime)}) ${
      !optimisticOperation
        ? JSON.stringify(toSignedOperationRaw(signedOperation))
        : ""
    }\n`;
  }

  if (optimisticOperation) {
    str += `✔️ broadcasted! (${formatDt(
      signedTime,
      broadcastedTime
    )}) optimistic operation: ${formatOp(account)(optimisticOperation)}\n`;
  }
  if (operation) {
    str += `✔️ operation confirmed (${formatDt(
      broadcastedTime,
      confirmedTime
    )}): ${formatOp(finalAccount || account)(operation)}\n`;
  }
  if (finalAccount) {
    str += `account updated:\n ${formatAccount(finalAccount, "summary")}\n`;
  }
  if (error) {
    str += `⚠️ ${String(error)}\n`;
  }
  return str;
}

// TODO future
export function formatReportForGithub<T>(report: MutationReport<T>) {
  return JSON.stringify(report);
}
