import React, { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent } from "@ledgerhq/lumen-ui-react";
import { cancelWithdrawRequest } from "@ledgerhq/live-common/wallet-api/Perps/withdraw/request";
import { PerpsWithdrawSignView } from "./PerpsWithdrawSignView";
import {
  usePerpsWithdrawSignViewModel,
  type PerpsWithdrawSignData,
} from "./usePerpsWithdrawSignViewModel";

let _opener: ((data: PerpsWithdrawSignData) => void) | null = null;

function registerPerpsWithdrawSignOpener(fn: (data: PerpsWithdrawSignData) => void): () => void {
  _opener = fn;
  return () => {
    _opener = null;
  };
}

export function openPerpsWithdrawSign(data: PerpsWithdrawSignData) {
  _opener?.(data);
}

function PerpsWithdrawSignBody({
  data,
  onClose,
}: Readonly<{ data: PerpsWithdrawSignData; onClose: () => void }>) {
  const viewModel = usePerpsWithdrawSignViewModel(data, onClose);
  return <PerpsWithdrawSignView {...viewModel} />;
}

export default function PerpsWithdrawSignRoot() {
  const [data, setData] = useState<PerpsWithdrawSignData | null>(null);
  const close = useCallback(() => setData(null), []);

  useEffect(() => registerPerpsWithdrawSignOpener(setData), []);

  // Once submitted the request is committed, so this no longer reports a refusal.
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
      <DialogContent
        onInteractOutside={e => e.preventDefault()}
        onEscapeKeyDown={e => e.preventDefault()}
      >
        {data ? <PerpsWithdrawSignBody data={data} onClose={close} /> : null}
      </DialogContent>
    </Dialog>
  );
}
