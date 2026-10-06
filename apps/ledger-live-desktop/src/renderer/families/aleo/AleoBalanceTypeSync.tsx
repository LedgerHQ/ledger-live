import React, { useEffect, useLayoutEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button, DialogBody, DialogFooter, Spot } from "@ledgerhq/lumen-ui-react";
import { isPrivateTransaction } from "@ledgerhq/live-common/families/aleo/utils";
import type { AleoAccount, Transaction } from "@ledgerhq/live-common/families/aleo/types";
import { useAleoPrivateSync } from "./hooks/useAleoPrivateSync";

type Props = Readonly<{
  account: AleoAccount;
  transaction: Transaction;
  onComplete: () => void;
  onCancel: () => void;
}>;

type PrivateSyncProgressProps = Omit<Props, "transaction">;

function PrivateSyncProgress({ account, onComplete, onCancel }: PrivateSyncProgressProps) {
  const { t } = useTranslation();
  const { progress, isSyncing, error, start } = useAleoPrivateSync({ account, autoStart: true });

  const isDone = !isSyncing && !error && progress >= 100;

  useEffect(() => {
    if (isDone) onComplete();
  }, [isDone, onComplete]);

  const percentage = Math.min(Math.round(progress), 100);

  return (
    <>
      <DialogBody
        className="flex flex-col items-center gap-16 py-24 text-center"
        data-testid="aleo-private-sync"
      >
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
      <DialogFooter className="flex flex-col gap-8">
        {error ? (
          <Button appearance="base" size="lg" isFull onClick={start}>
            {t("common.retry")}
          </Button>
        ) : null}
        <Button appearance="gray" size="lg" isFull onClick={onCancel}>
          {t("common.cancel")}
        </Button>
      </DialogFooter>
    </>
  );
}

function SkipSync({ onComplete }: Readonly<{ onComplete: () => void }>) {
  useLayoutEffect(() => {
    onComplete();
  }, [onComplete]);
  return null;
}

export function AleoBalanceTypeSync({ account, transaction, onComplete, onCancel }: Props) {
  if (transaction.family !== "aleo" || !isPrivateTransaction(transaction)) {
    return <SkipSync onComplete={onComplete} />;
  }

  return (
    <PrivateSyncProgress
      key={account.id}
      account={account}
      onComplete={onComplete}
      onCancel={onCancel}
    />
  );
}
