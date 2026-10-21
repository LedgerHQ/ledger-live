import React from "react";
import { createPortal } from "react-dom";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  Spot,
} from "@ledgerhq/lumen-ui-react";
import { ExternalLink, Information } from "@ledgerhq/lumen-ui-react/symbols";
import type { AleoAccount, Transaction } from "@ledgerhq/live-common/families/aleo/types";
import {
  useAleoEstimatedTimeViewModel,
  type AleoEstimatedTimeViewModel,
} from "./hooks/useAleoEstimatedTimeViewModel";

type EstimatedTimeInfoDialogProps = Readonly<{
  info: AleoEstimatedTimeViewModel["info"];
}>;

function EstimatedTimeInfoDialog({ info }: EstimatedTimeInfoDialogProps) {
  return (
    <Dialog open={info.isOpen} onOpenChange={open => !open && info.onClose()}>
      {info.isOpen
        ? createPortal(
            <div
              className="fixed inset-0 z-dialog-content bg-canvas-overlay backdrop-blur-sm animate-fade-in"
              data-testid="send-estimated-time-info-backdrop"
            />,
            document.body,
          )
        : null}
      <DialogContent aria-describedby={undefined} data-testid="send-estimated-time-info-dialog">
        <DialogHeader density="compact" onClose={info.onClose} />
        <DialogBody className="flex flex-col items-center gap-16 text-center">
          <Spot appearance="info" size={56} />
          <div className="flex flex-col gap-8">
            <h3 className="heading-4-semi-bold text-base">{info.title}</h3>
            <p className="body-2 text-muted">{info.description}</p>
          </div>
        </DialogBody>
        <DialogFooter className="flex flex-col gap-8">
          <Button appearance="base" size="lg" isFull onClick={info.onClose}>
            {info.confirmLabel}
          </Button>
          <Button
            appearance="gray"
            size="lg"
            isFull
            icon={ExternalLink}
            onClick={info.onLearnMore}
            data-testid="send-estimated-time-learn-more"
          >
            {info.learnMoreLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type Props = Readonly<{
  account: AleoAccount;
  transaction: Transaction;
}>;

export function AleoEstimatedTimeRow({ transaction }: Props) {
  const { label, value, info } = useAleoEstimatedTimeViewModel(transaction);

  return (
    <>
      <div
        className="flex w-full items-center justify-between mb-12"
        data-testid="send-estimated-time-row"
      >
        <span className="flex items-center gap-8">
          <span className="body-3">{label}</span>
          <button
            type="button"
            onClick={info.onOpen}
            aria-label={info.title}
            className="flex cursor-pointer items-center transition-colors hover:opacity-70"
            data-testid="send-estimated-time-info-button"
          >
            <Information size={16} className="text-muted" />
          </button>
        </span>
        <span className="body-3 text-base" data-testid="send-estimated-time-value">
          {value}
        </span>
      </div>
      <EstimatedTimeInfoDialog info={info} />
    </>
  );
}
