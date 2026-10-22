import React, { useLayoutEffect } from "react";
import { Button, DialogBody, DialogFooter, Spinner, Spot } from "@ledgerhq/lumen-ui-react";
import { DeleteCircleFill, InformationFill } from "@ledgerhq/lumen-ui-react/symbols";
import { isPrivateTransaction } from "@ledgerhq/live-common/families/aleo/utils";
import type { AleoAccount, Transaction } from "@ledgerhq/live-common/families/aleo/types";
import { cn } from "LLD/utils/cn";
import {
  useSendBalanceTypeSyncViewModel,
  type SendBalanceTypeSyncViewModel,
} from "./useSendBalanceTypeSyncViewModel";

type Props = Readonly<{
  account: AleoAccount;
  transaction: Transaction;
  onComplete: () => void;
  onClose: () => void;
}>;

const STATUS_STYLE = {
  error: { spot: { appearance: "error", icon: DeleteCircleFill }, gradient: "bg-gradient-error" },
  recordLimit: {
    spot: { appearance: "muted", icon: InformationFill },
    gradient: "bg-gradient-muted",
  },
} as const;

function SendBalanceTypeSyncView({
  viewModel,
}: Readonly<{ viewModel: SendBalanceTypeSyncViewModel }>) {
  const isSyncing = viewModel.status === "syncing";

  return (
    <>
      <DialogBody
        className={cn(
          "flex flex-col items-center pb-32 text-center",
          isSyncing ? "gap-16 pt-32" : "-mt-12 gap-24",
        )}
        data-testid={`aleo-balance-type-sync-${viewModel.status}`}
      >
        {isSyncing ? (
          <div className="flex">
            <Spinner size={32} />
          </div>
        ) : (
          <>
            <div
              className={cn(
                "pointer-events-none absolute inset-x-0 top-0 h-full",
                STATUS_STYLE[viewModel.status].gradient,
              )}
            />
            <Spot {...STATUS_STYLE[viewModel.status].spot} size={72} />
          </>
        )}
        <div className={cn("flex flex-col", isSyncing ? "gap-8" : "gap-12")}>
          <h3 className="heading-4-semi-bold text-base">{viewModel.title}</h3>
          <p className="body-2 text-muted">
            {isSyncing ? viewModel.progressLabel : viewModel.description}
          </p>
        </div>
      </DialogBody>
      {viewModel.status === "error" ? (
        <DialogFooter className="flex flex-col gap-16">
          <Button appearance="base" size="lg" isFull onClick={viewModel.onRetry}>
            {viewModel.retryLabel}
          </Button>
          <Button appearance="gray" size="lg" isFull onClick={viewModel.onCancel}>
            {viewModel.cancelLabel}
          </Button>
        </DialogFooter>
      ) : null}
      {viewModel.status === "recordLimit" ? (
        <DialogFooter>
          <Button appearance="base" size="lg" isFull onClick={viewModel.onContinue}>
            {viewModel.continueLabel}
          </Button>
        </DialogFooter>
      ) : null}
    </>
  );
}

function PrivateSync(props: Props) {
  const viewModel = useSendBalanceTypeSyncViewModel(props);
  return <SendBalanceTypeSyncView viewModel={viewModel} />;
}

function SkipSync({ onComplete }: Readonly<{ onComplete: () => void }>) {
  useLayoutEffect(() => {
    onComplete();
  }, [onComplete]);
  return null;
}

export default function SendBalanceTypeSync(props: Props) {
  if (!isPrivateTransaction(props.transaction)) {
    return <SkipSync onComplete={props.onComplete} />;
  }

  return <PrivateSync {...props} />;
}
