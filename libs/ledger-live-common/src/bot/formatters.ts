import groupBy from "lodash/groupBy";
import { formatError } from "@ledgerhq/coin-framework/bot/formatters";
import { formatOperation, formatAccount } from "../account";
import { toSignedOperationRaw, formatTransaction, formatTransactionStatus } from "../transaction";
import { formatCurrencyUnit } from "../currencies";
import type { MutationReport, AppCandidate } from "./types";
import type { TransactionCommon } from "@ledgerhq/types-live";

const formatTimeMinSec = (t: number) => {
  const totalsecs = Math.round(t / 1000);
  const min = Math.floor(totalsecs / 60);
  const sec = totalsecs - min * 60;
  if (!sec) return `${min}min`;
  return `${min}min ${sec}s`;
};

export { formatError };

export const formatTime = (t: number): string =>
  !t
    ? "N/A"
    : t > 3000
      ? t > 100000
        ? formatTimeMinSec(t)
        : `${Math.round(t / 100) / 10}s`
      : `${t < 5 ? t.toFixed(2) : t.toFixed(0)}ms`;

const formatDt = (from, to) => (from && to ? formatTime(to - from) : "?");

export function formatAppCandidate(appCandidate: AppCandidate): string {
  return `${appCandidate.appName} ${appCandidate.appVersion} on ${appCandidate.model} ${appCandidate.firmware}`;
}

export function formatReportForConsole<T extends TransactionCommon>({
  resyncAccountsDuration,
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
  finalDestination,
  finalDestinationOperation,
  testDestinationDuration,
  testDuration,
  error,
  errorTime,
}: MutationReport<T>): string {
  let str = "";
  str += `necessary accounts resynced in ${formatTime(resyncAccountsDuration)}\n`;
  str += `▬ ${formatAppCandidate(appCandidate)}\n`;

  if (account) {
    str += `→ FROM ${formatAccount(account, "basic")}\n`;
  }

  if (account && maxSpendable) {
    str += `max spendable ~${formatCurrencyUnit(account.currency.units[0], maxSpendable)}\n`;
  }

  if (unavailableMutationReasons) {
    let detail = "?";

    if (account && !account.used) {
      detail = "account is empty";
    } else {
      const byErrorMessage = groupBy(unavailableMutationReasons, r => r.error.message);
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
    str += `✔️ transaction ${formatTransaction(transaction as any, account)}\n`;
  }

  if (status && transaction && account) {
    str += `STATUS (${formatDt(mutationTime, statusTime)})${formatTransactionStatus(
      transaction as any,
      status,
      account,
    )}\n`;
  }

  if (recoveredFromTransactionStatus && account) {
    str += `\n⚠️ recovered from transaction ${formatTransaction(
      recoveredFromTransactionStatus.transaction as any,
      account,
    )}\nof status ${formatTransactionStatus(
      recoveredFromTransactionStatus.transaction as any,
      recoveredFromTransactionStatus.status,
      account,
    )}\n\n`.replace(/\n/g, "\n  ");
  }

  if (signedOperation) {
    str += `✔️ has been signed! (${formatDt(statusTime, signedTime)}) ${
      !optimisticOperation ? JSON.stringify(toSignedOperationRaw(signedOperation)) : ""
    }\n`;
  }

  if (optimisticOperation) {
    str += `✔️ broadcasted! (${formatDt(
      signedTime,
      broadcastedTime,
    )}) optimistic operation: ${formatOperation(account)(optimisticOperation)}\n`;
  }

  if (operation) {
    str += `✔️ operation confirmed (${formatDt(broadcastedTime, confirmedTime)}): ${formatOperation(
      finalAccount || account,
    )(operation)}\n`;
  }

  if (finalAccount) {
    str += `✔️ ${formatAccount(finalAccount, "basic")}`;
  }

  if (testDuration) {
    str += `(in ${formatTime(testDuration)})\n`;
  }

  if (finalDestination && finalDestinationOperation) {
    str += `✔️ destination operation ${formatOperation(finalDestination)(
      finalDestinationOperation,
    )}\n`;
  }

  if (testDestinationDuration) {
    str += `(in ${formatTime(testDestinationDuration)})\n`;
  }

  if (error) {
    str += `⚠️ ${formatError(error, true)}\n`;
    if (mutationTime && errorTime) {
      str += `(totally spent ${formatTime(
        errorTime - mutationTime,
      )} – ends at ${new Date().toISOString()})`;
    }
  }

  return str;
}
