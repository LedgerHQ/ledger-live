import React, { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent } from "@ledgerhq/lumen-ui-react";
import type { PerpsReviewData } from "./usePerpsReviewViewModel";
import { usePerpsReviewViewModel } from "./usePerpsReviewViewModel";
import { PerpsReviewView } from "./PerpsReviewView";

let _opener: ((data: PerpsReviewData) => void) | null = null;

function registerPerpsReviewOpener(fn: (data: PerpsReviewData) => void): () => void {
  _opener = fn;
  return () => {
    _opener = null;
  };
}

export function openPerpsReview(data: PerpsReviewData) {
  _opener?.(data);
}

function PerpsReviewBody({
  data,
  onClose,
}: Readonly<{ data: PerpsReviewData; onClose: () => void }>) {
  const viewModel = usePerpsReviewViewModel(data, onClose);
  return <PerpsReviewView {...viewModel} />;
}

function PerpsReviewInnerDialog({
  data,
  onClose,
}: Readonly<{ data: PerpsReviewData | null; onClose: () => void }>) {
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
        {data ? <PerpsReviewBody data={data} onClose={onClose} /> : null}
      </DialogContent>
    </Dialog>
  );
}

export default function PerpsReviewRoot() {
  const [data, setData] = useState<PerpsReviewData | null>(null);
  const close = useCallback(() => setData(null), []);

  useEffect(() => registerPerpsReviewOpener(setData), []);

  return <PerpsReviewInnerDialog data={data} onClose={close} />;
}
