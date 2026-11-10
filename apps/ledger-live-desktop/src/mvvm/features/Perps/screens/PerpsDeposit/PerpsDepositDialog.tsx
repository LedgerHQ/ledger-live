import React, { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent } from "@ledgerhq/lumen-ui-react";
import type { PerpsDepositData, PerpsDepositFormState } from "./usePerpsDepositViewModel";
import { usePerpsDepositFormState, usePerpsDepositViewModel } from "./usePerpsDepositViewModel";
import { PerpsDepositView } from "./PerpsDepositView";
import { cancelDepositRequest } from "@ledgerhq/live-common/wallet-api/Perps/deposit/request";
import { useIsDrawerOpen } from "LLD/features/Perps/hooks/useIsDrawerOpen";

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
  form,
}: Readonly<{ data: PerpsDepositData; onClose: () => void; form: PerpsDepositFormState }>) {
  const viewModel = usePerpsDepositViewModel(data, onClose, form);
  return <PerpsDepositView {...viewModel} />;
}

function PerpsDepositInnerDialog({
  data,
  requestId,
  onClose,
}: Readonly<{ data: PerpsDepositData | null; requestId: number; onClose: () => void }>) {
  const form = usePerpsDepositFormState(data);
  const isDrawerOpen = useIsDrawerOpen();
  // Hiding through `open` skips `onOpenChange`, so the pending deposit request is kept.
  const isOpen = data !== null && !isDrawerOpen;

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (open) return;
      cancelDepositRequest();
      onClose();
    },
    [onClose],
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent onInteractOutside={e => e.preventDefault()}>
        {data ? (
          <PerpsDepositBody key={requestId} data={data} onClose={onClose} form={form} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export default function PerpsDepositRoot() {
  const [request, setRequest] = useState<{ data: PerpsDepositData; id: number } | null>(null);
  const close = useCallback(() => setRequest(null), []);
  const open = useCallback(
    (data: PerpsDepositData) => setRequest(previous => ({ data, id: (previous?.id ?? 0) + 1 })),
    [],
  );

  useEffect(() => registerPerpsDepositOpener(open), [open]);

  return (
    <PerpsDepositInnerDialog
      data={request?.data ?? null}
      requestId={request?.id ?? 0}
      onClose={close}
    />
  );
}
