import groupBy from "lodash/groupBy";
import type { Transaction } from "../types";
import { formatOperation, formatAccount } from "../account";
import {
  toSignedOperationRaw,
  formatTransaction,
  formatTransactionStatus,
} from "../transaction";
import { formatCurrencyUnit } from "../currencies";
import type { MutationReport, AppCandidate } from "./types";
export const formatTime = (t: number) =>
  t > 3000
    ? `${Math.round(t / 100) / 10}s`
    : `${t < 5 ? t.toFixed(2) : t.toFixed(0)}ms`;

const formatDt = (from, to) => (from && to ? formatTime(to - from) : "?");

export function formatAppCandidate(appCandidate: AppCandidate) {
  return `${appCandidate.appName} ${appCandidate.appVersion} on ${appCandidate.model} ${appCandidate.firmware}`;
}

export function formatError(e: any) {
  if (!e || typeof e !== "object" || e instanceof Error) return String(e);
  try {
    return "raw object: " + JSON.stringify(e).slice(0, 400);
  } catch (_e) {
    return String(e);
  }
}

export function formatReportForConsole<T extends Transaction>({
  syncAllAccountsTime,
  appCandidate,
  account,
  maxSpendable,
  unavailableMutationReasons,
  mutation,
  mutationTime,
  destination,
  transaction,
  statusTime,
  status,
  recoveredFromTransactionStatus,
  signedOperation,
  signedTime,
  optimisticOperation,
  broadcastedTime,
  operation,
  confirmedTime,
  finalAccount,
  testDuration,
  error,
}: MutationReport<T>): string {
  let str = "";
  str += `all accounts sync in ${formatTime(syncAllAccountsTime)}\n`;
  str += `▬ ${formatAppCandidate(appCandidate)}\n`;

  if (account) {
    str += `→ FROM ${formatAccount(account, "basic")}\n`;
  }

  if (account && maxSpendable) {
    str += `max spendable ~${formatCurrencyUnit(account.unit, maxSpendable)}\n`;
  }

  if (unavailableMutationReasons) {
    let detail = "?";

    if (account && !account.used) {
      detail = "account is empty";
    } else {
      const byErrorMessage = groupBy(unavailableMutationReasons, "message");
      const keys = Object.keys(byErrorMessage);

      if (keys.length === 1) {
        detail = keys[0];
      } else {
        detail = unavailableMutationReasons
          .map(({ mutation, error }) => mutation.name + ": " + error.message)
          .join(", ");
      }
    }

    str += `🤷‍♂️ couldn't find a mutation to do! (${detail})\n`;
  }

  if (mutation) {
    str += `★ using mutation '${mutation.name}'\n`;
  }

  if (destination) {
    str += `→ TO ${formatAccount(destination, "head")}\n`;
  }

  if (transaction && account) {
    str += `✔️ transaction ${formatTransaction(transaction, account)}\n`;
  }

  if (status && transaction && account) {
    str += `STATUS (${formatDt(
      mutationTime,
      statusTime
    )})${formatTransactionStatus(transaction, status, account)}\n`;
  }

  if (recoveredFromTransactionStatus && account) {
    str += `\n⚠️ recovered from transaction ${formatTransaction(
      recoveredFromTransactionStatus.transaction,
      account
    )}\nof status ${formatTransactionStatus(
      recoveredFromTransactionStatus.transaction,
      recoveredFromTransactionStatus.status,
      account
    )}\n\n`.replace(/\n/g, "\n  ");
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
    )}) optimistic operation: ${formatOperation(account)(
      optimisticOperation
    )}\n`;
  }

  if (operation) {
    str += `✔️ operation confirmed (${formatDt(
      broadcastedTime,
      confirmedTime
    )}): ${formatOperation(finalAccount || account)(operation)}\n`;
  }

  if (finalAccount) {
    str += `✔️ ${formatAccount(finalAccount, "basic")}\n`;
  }

  if (testDuration) {
    str += `(final state reached in ${formatTime(testDuration)})\n`;
  }

  if (error) {
    str += `⚠️ ${formatError(error)}\n`;
  }

  return str;
}
