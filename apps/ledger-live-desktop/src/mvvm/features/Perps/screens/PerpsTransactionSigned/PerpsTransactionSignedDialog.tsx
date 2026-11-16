import React, { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent } from "@ledgerhq/lumen-ui-react";
import { usePerpsTransactionSignedViewModel } from "./usePerpsTransactionSignedViewModel";
import type { PerpsTransactionSignedParams } from "@ledgerhq/live-common/wallet-api/Perps/reviewDetails";
import { PerpsTransactionSignedView } from "./PerpsTransactionSignedView";

let _opener: ((data: PerpsTransactionSignedParams) => void) | null = null;

function registerPerpsTransactionSignedOpener(
  fn: (data: PerpsTransactionSignedParams) => void,
): () => void {
  _opener = fn;
  return () => {
    _opener = null;
  };
}

export function openPerpsTransactionSigned(data: PerpsTransactionSignedParams) {
  _opener?.(data);
}

function PerpsTransactionSignedBody({
  data,
  onClose,
}: Readonly<{ data: PerpsTransactionSignedParams; onClose: () => void }>) {
  const viewModel = usePerpsTransactionSignedViewModel(data, onClose);
  return <PerpsTransactionSignedView {...viewModel} />;
}

function PerpsTransactionSignedInnerDialog({
  data,
  onClose,
}: Readonly<{ data: PerpsTransactionSignedParams | null; onClose: () => void }>) {
  const isOpen = data !== null;

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) onClose();
    },
    [onClose],
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange} height="fit">
      <DialogContent
        aria-describedby={undefined}
        className="w-[400px] p-0"
        onInteractOutside={e => e.preventDefault()}
      >
        {data ? <PerpsTransactionSignedBody data={data} onClose={onClose} /> : null}
      </DialogContent>
    </Dialog>
  );
}

export default function PerpsTransactionSignedRoot() {
  const [data, setData] = useState<PerpsTransactionSignedParams | null>(null);
  const close = useCallback(() => setData(null), []);

  useEffect(() => registerPerpsTransactionSignedOpener(setData), []);

  return <PerpsTransactionSignedInnerDialog data={data} onClose={close} />;
}
