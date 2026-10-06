import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  Spot,
} from "@ledgerhq/lumen-ui-react";
import type { Account } from "@ledgerhq/types-live";
import { isAleoAccount, isPrivateTransaction } from "@ledgerhq/live-common/families/aleo/utils";
import type { AleoAccount, Transaction } from "@ledgerhq/live-common/families/aleo/types";
import { useAleoPrivateSync } from "./hooks/useAleoPrivateSync";

type Props = Readonly<{
  account: AleoAccount;
  transaction: Transaction;
  onComplete: () => void;
  onCancel: () => void;
  onAccountUpdated: (account: AleoAccount) => void;
}>;

type PrivateSyncDialogProps = Omit<Props, "transaction">;

function PrivateSyncDialog({
  account,
  onComplete,
  onCancel,
  onAccountUpdated,
}: PrivateSyncDialogProps) {
  const { t } = useTranslation();
  const { progress, isSyncing, error, start } = useAleoPrivateSync({
    account,
    autoStart: true,
    onAccountUpdated: (updatedAccount: Account) => {
      if (updatedAccount.type === "Account" && isAleoAccount(updatedAccount)) {
        onAccountUpdated(updatedAccount);
      }
    },
  });

  const isDone = !isSyncing && !error && progress >= 100;

  useEffect(() => {
    if (isDone) onComplete();
  }, [isDone, onComplete]);

  if (isDone) return null;

  const percentage = Math.min(Math.round(progress), 100);

  return (
    <Dialog open onOpenChange={open => !open && onCancel()}>
      <DialogContent aria-describedby={undefined} data-testid="aleo-private-sync-dialog">
        <DialogHeader density="compact" onClose={onCancel} />
        <DialogBody className="flex flex-col items-center gap-16 pb-24 text-center">
          <Spot appearance={error ? "error" : "loader"} size={48} />
          <div className="flex flex-col gap-8">
            <h3 className="heading-4-semi-bold text-base">
              {error
                ? t("aleo.send.newFlowPrivateSync.errorTitle")
                : t("aleo.send.newFlowPrivateSync.title")}
            </h3>
            <p className="body-2 text-muted">
              {error
                ? t("aleo.send.newFlowPrivateSync.errorDescription")
                : t("aleo.send.newFlowPrivateSync.description")}
            </p>
          </div>
          {error ? null : (
            <div className="flex w-full flex-col gap-8" data-testid="aleo-private-sync-progress">
              <div className="h-4 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-interactive transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="body-3 text-muted">
                {t("aleo.send.newFlowPrivateSync.progress", { percentage })}
              </span>
            </div>
          )}
        </DialogBody>
        {error ? (
          <DialogFooter>
            <Button appearance="base" size="lg" isFull onClick={start}>
              {t("common.retry")}
            </Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function SkipSync({ onComplete }: Readonly<{ onComplete: () => void }>) {
  useEffect(() => {
    onComplete();
  }, [onComplete]);
  return null;
}

/**
 * Refreshes the private records once the private balance is picked, the way the legacy
 * flow's mandatory sync step did: the flow only moves on to the recipient once the sync
 * lands, and the refreshed account is handed back so the transaction picks its records
 * from it. A public pick needs no sync and moves on straight away.
 */
export function AleoBalanceTypeSync({
  account,
  transaction,
  onComplete,
  onCancel,
  onAccountUpdated,
}: Props) {
  if (transaction.family !== "aleo" || !isPrivateTransaction(transaction)) {
    return <SkipSync onComplete={onComplete} />;
  }

  return (
    <PrivateSyncDialog
      key={account.id}
      account={account}
      onComplete={onComplete}
      onCancel={onCancel}
      onAccountUpdated={onAccountUpdated}
    />
  );
}
