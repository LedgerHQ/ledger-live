import React, { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent } from "@ledgerhq/lumen-ui-react";
import { usePerpsSignViewModel, type PerpsSignData } from "./usePerpsSignViewModel";
import { PerpsSignView } from "./PerpsSignView";

let _opener: ((data: PerpsSignData) => void) | null = null;

function registerPerpsSignOpener(fn: (data: PerpsSignData) => void): () => void {
  _opener = fn;
  return () => {
    _opener = null;
  };
}

export function openPerpsSign(data: PerpsSignData) {
  _opener?.(data);
}

function PerpsSignBody({ data, onClose }: Readonly<{ data: PerpsSignData; onClose: () => void }>) {
  const viewModel = usePerpsSignViewModel(data, onClose);
  return <PerpsSignView {...viewModel} />;
}

function PerpsSignInnerDialog({
  data,
  onClose,
}: Readonly<{ data: PerpsSignData | null; onClose: () => void }>) {
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
        {data ? <PerpsSignBody data={data} onClose={onClose} /> : null}
      </DialogContent>
    </Dialog>
  );
}

export default function PerpsSignRoot() {
  const [data, setData] = useState<PerpsSignData | null>(null);
  const close = useCallback(() => setData(null), []);

  useEffect(() => registerPerpsSignOpener(setData), []);

  return <PerpsSignInnerDialog data={data} onClose={close} />;
}
