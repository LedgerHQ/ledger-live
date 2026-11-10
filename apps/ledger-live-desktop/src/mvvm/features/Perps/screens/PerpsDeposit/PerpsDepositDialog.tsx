import React, { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent } from "@ledgerhq/lumen-ui-react";
import type { PerpsDepositData, PerpsDepositFormState } from "./usePerpsDepositViewModel";
import { usePerpsDepositFormState, usePerpsDepositViewModel } from "./usePerpsDepositViewModel";
import { PerpsDepositView } from "./PerpsDepositView";
import { cancelDepositRequest } from "@ledgerhq/live-common/wallet-api/Perps/deposit/request";
import { useIsDrawerOpen } from "LLD/features/Perps/hooks/useIsDrawerOpen";
import { useOnNavigateAway } from "LLD/features/Perps/hooks/useOnNavigateAway";

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

export default function PerpsDepositRoot() {
  const [request, setRequest] = useState<{ data: PerpsDepositData; id: number } | null>(null);
  const { form, reset } = usePerpsDepositFormState();
  const data = request?.data ?? null;
  const close = useCallback(() => setRequest(null), []);
  const open = useCallback(
    (next: PerpsDepositData) => {
      reset(next.draft);
      setRequest(previous => ({ data: next, id: (previous?.id ?? 0) + 1 }));
    },
    [reset],
  );

  useEffect(() => registerPerpsDepositOpener(open), [open]);

  const cancel = useCallback(() => {
    cancelDepositRequest();
    close();
  }, [close]);

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) cancel();
    },
    [cancel],
  );

  useOnNavigateAway(data !== null, cancel);
  const isDrawerOpen = useIsDrawerOpen();

  return (
    <Dialog open={data !== null && !isDrawerOpen} onOpenChange={handleOpenChange}>
      <DialogContent onInteractOutside={e => e.preventDefault()}>
        {data ? (
          <PerpsDepositBody key={request?.id} data={data} onClose={close} form={form} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
