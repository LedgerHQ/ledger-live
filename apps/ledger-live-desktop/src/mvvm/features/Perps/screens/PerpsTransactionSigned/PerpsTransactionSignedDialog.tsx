import React, { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent } from "@ledgerhq/lumen-ui-react";
import {
  usePerpsTransactionSignedViewModel,
  type PerpsTransactionSignedData,
} from "./usePerpsTransactionSignedViewModel";
import { PerpsTransactionSignedView } from "./PerpsTransactionSignedView";

let _opener: ((data: PerpsTransactionSignedData) => void) | null = null;

function registerPerpsTransactionSignedOpener(
  fn: (data: PerpsTransactionSignedData) => void,
): () => void {
  _opener = fn;
  return () => {
    _opener = null;
  };
}

export function openPerpsTransactionSigned(data: PerpsTransactionSignedData) {
  _opener?.(data);
}

function PerpsTransactionSignedBody({
  data,
  onClose,
}: Readonly<{ data: PerpsTransactionSignedData; onClose: () => void }>) {
  const viewModel = usePerpsTransactionSignedViewModel(data, onClose);
  return <PerpsTransactionSignedView {...viewModel} />;
}

function PerpsTransactionSignedInnerDialog({
  data,
  onClose,
}: Readonly<{ data: PerpsTransactionSignedData | null; onClose: () => void }>) {
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
        className="w-[400px] bg-base p-0"
        onInteractOutside={e => e.preventDefault()}
      >
        {data ? <PerpsTransactionSignedBody data={data} onClose={onClose} /> : null}
      </DialogContent>
    </Dialog>
  );
}

export default function PerpsTransactionSignedRoot() {
  const [data, setData] = useState<PerpsTransactionSignedData | null>(null);
  const close = useCallback(() => setData(null), []);

  useEffect(() => registerPerpsTransactionSignedOpener(setData), []);

  return <PerpsTransactionSignedInnerDialog data={data} onClose={close} />;
}
