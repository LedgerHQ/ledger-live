import React, { useCallback, useEffect, useRef, useState } from "react";
import { Dialog, DialogContent } from "@ledgerhq/lumen-ui-react";
import type { PerpsSignRequest } from "@ledgerhq/live-common/wallet-api/Perps/server";
import { useFeature } from "@features/platform-feature-flags";
import { usePerpsSignViewModel, type PerpsSignData } from "./usePerpsSignViewModel";
import { PerpsSignView } from "./PerpsSignView";
import { PerpsSignExecutor } from "./PerpsSignExecutor";

let _opener: ((request: PerpsSignRequest) => void) | null = null;

function registerPerpsSignOpener(fn: (request: PerpsSignRequest) => void): () => void {
  _opener = fn;
  return () => {
    _opener = null;
  };
}

export function openPerpsSign(request: PerpsSignRequest) {
  _opener?.(request);
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

type PendingSignRequest = Readonly<{ id: number; request: PerpsSignRequest }>;

export default function PerpsSignRoot() {
  const deviceIntentSignEnabled = useFeature("ptxPerpsDeviceIntentSign")?.enabled ?? false;
  const [pending, setPending] = useState<PendingSignRequest | null>(null);
  const lastIdRef = useRef(0);
  const close = useCallback(() => setPending(null), []);

  useEffect(
    () =>
      registerPerpsSignOpener(request => {
        lastIdRef.current += 1;
        setPending({ id: lastIdRef.current, request });
      }),
    [],
  );

  if (deviceIntentSignEnabled) {
    return pending ? (
      <PerpsSignExecutor key={pending.id} request={pending.request} onClose={close} />
    ) : null;
  }

  return <PerpsSignInnerDialog data={pending?.request ?? null} onClose={close} />;
}
