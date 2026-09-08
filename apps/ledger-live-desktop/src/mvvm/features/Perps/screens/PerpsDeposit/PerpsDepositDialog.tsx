import React, { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent } from "@ledgerhq/lumen-ui-react";
import type { PerpsDepositData } from "./usePerpsDepositViewModel";
import { usePerpsDepositViewModel } from "./usePerpsDepositViewModel";
import { PerpsDepositView } from "./PerpsDepositView";

let _opener: ((data: PerpsDepositData) => void) | null = null;

function registerPerpsDepositOpener(fn: (data: PerpsDepositData) => void): () => void {
  _opener = fn;
  return () => {
    _opener = null;
  };
}

export function openPerpsDeposit(data: PerpsDepositData) {
  _opener?.(data);
}

function PerpsDepositBody({
  data,
  onClose,
}: Readonly<{ data: PerpsDepositData; onClose: () => void }>) {
  const viewModel = usePerpsDepositViewModel(data, onClose);
  return <PerpsDepositView {...viewModel} />;
}

function PerpsDepositInnerDialog({
  data,
  onClose,
}: Readonly<{ data: PerpsDepositData | null; onClose: () => void }>) {
  const isOpen = data !== null;

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) onClose();
    },
    [onClose],
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent onInteractOutside={e => e.preventDefault()}>
        {data ? <PerpsDepositBody data={data} onClose={onClose} /> : null}
      </DialogContent>
    </Dialog>
  );
}

export default function PerpsDepositRoot() {
  const [data, setData] = useState<PerpsDepositData | null>(null);
  const close = useCallback(() => setData(null), []);

  useEffect(() => registerPerpsDepositOpener(setData), []);

  return <PerpsDepositInnerDialog data={data} onClose={close} />;
}
