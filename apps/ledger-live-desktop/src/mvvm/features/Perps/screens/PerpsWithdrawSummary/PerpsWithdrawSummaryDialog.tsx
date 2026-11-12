import React, { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent } from "@ledgerhq/lumen-ui-react";
import { cancelWithdrawRequest } from "@ledgerhq/live-common/wallet-api/Perps/withdraw/request";
import { PerpsWithdrawSummaryView } from "./PerpsWithdrawSummaryView";
import {
  usePerpsWithdrawSummaryViewModel,
  type PerpsWithdrawSummaryData,
} from "./usePerpsWithdrawSummaryViewModel";

let _opener: ((data: PerpsWithdrawSummaryData) => void) | null = null;

function registerPerpsWithdrawSummaryOpener(
  fn: (data: PerpsWithdrawSummaryData) => void,
): () => void {
  _opener = fn;
  return () => {
    _opener = null;
  };
}

export function openPerpsWithdrawSummary(data: PerpsWithdrawSummaryData) {
  _opener?.(data);
}

function PerpsWithdrawSummaryBody({
  data,
  onClose,
}: Readonly<{ data: PerpsWithdrawSummaryData; onClose: () => void }>) {
  const viewModel = usePerpsWithdrawSummaryViewModel(data, onClose);
  return <PerpsWithdrawSummaryView {...viewModel} />;
}

export default function PerpsWithdrawSummaryRoot() {
  const [data, setData] = useState<PerpsWithdrawSummaryData | null>(null);
  const [openCount, setOpenCount] = useState(0);
  const close = useCallback(() => setData(null), []);

  // Each open remounts the body so the quote state starts from the new quote.
  useEffect(
    () =>
      registerPerpsWithdrawSummaryOpener(next => {
        setData(next);
        setOpenCount(count => count + 1);
      }),
    [],
  );

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (open) return;
      cancelWithdrawRequest();
      close();
    },
    [close],
  );

  return (
    <Dialog open={data !== null} onOpenChange={handleOpenChange}>
      <DialogContent onInteractOutside={e => e.preventDefault()}>
        {data ? <PerpsWithdrawSummaryBody key={openCount} data={data} onClose={close} /> : null}
      </DialogContent>
    </Dialog>
  );
}
