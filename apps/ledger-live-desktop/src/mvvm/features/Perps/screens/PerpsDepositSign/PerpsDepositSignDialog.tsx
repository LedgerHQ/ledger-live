import React, { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent } from "@ledgerhq/lumen-ui-react";
import {
  usePerpsDepositSignViewModel,
  type PerpsDepositSignData,
} from "./usePerpsDepositSignViewModel";
import { PerpsDepositSignView } from "./PerpsDepositSignView";

let _opener: ((data: PerpsDepositSignData) => void) | null = null;

function registerPerpsDepositSignOpener(fn: (data: PerpsDepositSignData) => void): () => void {
  _opener = fn;
  return () => {
    _opener = null;
  };
}

export function openPerpsDepositSign(data: PerpsDepositSignData) {
  _opener?.(data);
}

function PerpsDepositSignBody({
  data,
  onClose,
}: Readonly<{ data: PerpsDepositSignData; onClose: () => void }>) {
  const viewModel = usePerpsDepositSignViewModel(data, onClose);
  return <PerpsDepositSignView {...viewModel} />;
}

function PerpsDepositSignInnerDialog({
  data,
  onClose,
}: Readonly<{ data: PerpsDepositSignData | null; onClose: () => void }>) {
  const isOpen = data !== null;

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) onClose();
    },
    [onClose],
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        onInteractOutside={e => e.preventDefault()}
        onEscapeKeyDown={e => e.preventDefault()}
      >
        {data ? <PerpsDepositSignBody data={data} onClose={onClose} /> : null}
      </DialogContent>
    </Dialog>
  );
}

export default function PerpsDepositSignRoot() {
  const [data, setData] = useState<PerpsDepositSignData | null>(null);
  const close = useCallback(() => setData(null), []);

  useEffect(() => registerPerpsDepositSignOpener(setData), []);

  return <PerpsDepositSignInnerDialog data={data} onClose={close} />;
}
