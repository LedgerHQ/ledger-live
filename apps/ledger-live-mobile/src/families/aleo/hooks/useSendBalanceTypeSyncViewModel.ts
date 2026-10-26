import { useCallback, useEffect, useRef, useState } from "react";
import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import {
  getMaxPrivateRecordsForAccount,
  isAleoAccount,
  selectPrivateRecordsForAmount,
  sumPrivateRecords,
} from "@ledgerhq/live-common/families/aleo/utils";
import type {
  AleoAccount,
  AleoTokenAccount,
  Transaction,
} from "@ledgerhq/live-common/families/aleo/types";
import { useSelector } from "~/context/hooks";
import { useLocale, useTranslation } from "~/context/Locale";
import { discreetModeSelector } from "~/reducers/settings";
import { useAleoPrivateSync } from "./useAleoPrivateSync";

type RecordLimit = Readonly<{
  account: AleoAccount | AleoTokenAccount;
  amount: BigNumber;
}>;

export type SendBalanceTypeSyncViewModel =
  | Readonly<{ status: "syncing"; title: string; progressLabel: string }>
  | Readonly<{
      status: "error";
      title: string;
      description: string;
      retryLabel: string;
      cancelLabel: string;
      onRetry: () => void;
      onCancel: () => void;
    }>
  | Readonly<{
      status: "recordLimit";
      title: string;
      description: string;
      continueLabel: string;
      onContinue: () => void;
    }>;

function getSendingAccount(
  syncedAccount: Account,
  transaction: Transaction,
): AleoAccount | AleoTokenAccount | null {
  const sendingAccount = transaction.subAccountId
    ? syncedAccount.subAccounts?.find(subAccount => subAccount.id === transaction.subAccountId)
    : syncedAccount;

  return sendingAccount && isAleoAccount(sendingAccount) ? sendingAccount : null;
}

function getRecordLimitedAmount(account: AleoAccount | AleoTokenAccount): BigNumber | null {
  const unspentRecords =
    (account.type === "TokenAccount"
      ? account.unspentPrivateRecords
      : account.aleoResources?.unspentPrivateRecords) ?? [];
  const maxRecords = getMaxPrivateRecordsForAccount(account);
  const spendableRecordCount = unspentRecords.filter(record => {
    return new BigNumber(record.microcredits).isGreaterThan(0);
  }).length;
  if (spendableRecordCount <= maxRecords) return null;

  return sumPrivateRecords(
    selectPrivateRecordsForAmount({ unspentRecords, targetAmount: null, maxRecords }),
  );
}

export function useSendBalanceTypeSyncViewModel({
  account,
  transaction,
  onComplete,
  onClose,
}: Readonly<{
  account: AleoAccount;
  transaction: Transaction;
  onComplete: () => void;
  onClose: () => void;
}>): SendBalanceTypeSyncViewModel {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const discreet = useSelector(discreetModeSelector);
  const [recordLimit, setRecordLimit] = useState<RecordLimit | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const onAccountUpdated = useCallback(
    (syncedAccount: Account) => {
      if (!isMountedRef.current) return;
      if (!isAleoAccount(syncedAccount) || !syncedAccount.aleoResources?.provableApi) return;

      const sendingAccount = getSendingAccount(syncedAccount, transaction);
      const amount = sendingAccount ? getRecordLimitedAmount(sendingAccount) : null;
      if (sendingAccount && amount) {
        setRecordLimit({ account: sendingAccount, amount });
        return;
      }

      onComplete();
    },
    [transaction, onComplete],
  );

  const { progress, error, start } = useAleoPrivateSync({
    account,
    autoStart: true,
    keepAliveOnUnmount: true,
    onAccountUpdated,
  });

  if (error) {
    return {
      status: "error",
      title: t("aleo.send.balanceTypeSync.errorTitle"),
      description: t("aleo.send.balanceTypeSync.errorDescription"),
      retryLabel: t("common.tryAgain"),
      cancelLabel: t("common.cancel"),
      onRetry: start,
      onCancel: onClose,
    };
  }

  if (recordLimit) {
    const unit = getAccountCurrency(recordLimit.account).units[0];

    return {
      status: "recordLimit",
      title: t("aleo.send.balanceTypeSync.recordLimitTitle", {
        amount: formatCurrencyUnit(unit, recordLimit.amount, { showCode: true, locale, discreet }),
      }),
      description: t("aleo.send.balanceTypeSync.recordLimitDescription", {
        maxRecords: getMaxPrivateRecordsForAccount(recordLimit.account),
      }),
      continueLabel: t("common.continue"),
      onContinue: onComplete,
    };
  }

  return {
    status: "syncing",
    title: t("aleo.send.balanceTypeSync.title"),
    progressLabel: t("aleo.send.balanceTypeSync.progress", {
      percentage: Math.min(Math.round(progress), 100),
    }),
  };
}
