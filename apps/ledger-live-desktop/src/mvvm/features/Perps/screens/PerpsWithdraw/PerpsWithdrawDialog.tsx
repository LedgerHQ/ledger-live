import React, { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent } from "@ledgerhq/lumen-ui-react";
import { cancelWithdrawRequest } from "@ledgerhq/live-common/wallet-api/Perps/withdraw/request";
import { PerpsWithdrawView } from "./PerpsWithdrawView";
import { usePerpsWithdrawViewModel, type PerpsWithdrawData } from "./usePerpsWithdrawViewModel";

let _opener: ((data: PerpsWithdrawData) => void) | null = null;

function registerPerpsWithdrawOpener(fn: (data: PerpsWithdrawData) => void): () => void {
  _opener = fn;
  return () => {
    _opener = null;
  };
}

export function openPerpsWithdraw(data: PerpsWithdrawData) {
  _opener?.(data);
}

function PerpsWithdrawBody({ data }: Readonly<{ data: PerpsWithdrawData }>) {
  const viewModel = usePerpsWithdrawViewModel(data);
  return <PerpsWithdrawView {...viewModel} />;
}

export default function PerpsWithdrawRoot() {
  const [data, setData] = useState<PerpsWithdrawData | null>(null);
  const [openCount, setOpenCount] = useState(0);

  // Each open remounts the form so a draft from the summary becomes its initial state.
  useEffect(
    () =>
      registerPerpsWithdrawOpener(next => {
        setData(next);
        setOpenCount(count => count + 1);
      }),
    [],
  );

  const handleOpenChange = useCallback((open: boolean) => {
    if (open) return;
    cancelWithdrawRequest();
    setData(null);
  }, []);

  return (
    <Dialog open={data !== null} onOpenChange={handleOpenChange}>
      <DialogContent onInteractOutside={e => e.preventDefault()}>
        {data ? <PerpsWithdrawBody key={openCount} data={data} /> : null}
      </DialogContent>
    </Dialog>
  );
}
