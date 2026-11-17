import React, { useCallback, useEffect, useRef, useState } from "react";
import { Dialog, DialogContent } from "@ledgerhq/lumen-ui-react";
import type { PerpsSignRequest } from "@ledgerhq/live-common/wallet-api/Perps/server";
import { useFeature } from "@features/platform-feature-flags";
import { useOnNavigateAway } from "LLD/features/Perps/hooks/useOnNavigateAway";
import { usePerpsSignViewModel, type PerpsSignData } from "./usePerpsSignViewModel";
import { PerpsSignView } from "./PerpsSignView";
import { PerpsSignExecutor } from "./PerpsSignExecutor";
import type { PerpsSignManifest } from "./usePerpsSignExecutorViewModel";

let _opener: ((request: PerpsSignRequest, manifest?: PerpsSignManifest) => void) | null = null;

function registerPerpsSignOpener(
  fn: (request: PerpsSignRequest, manifest?: PerpsSignManifest) => void,
): () => void {
  _opener = fn;
  return () => {
    _opener = null;
  };
}

export function openPerpsSign(request: PerpsSignRequest, manifest?: PerpsSignManifest) {
  _opener?.(request, manifest);
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

type PendingSignRequest = Readonly<{
  id: number;
  request: PerpsSignRequest;
  manifest?: PerpsSignManifest;
}>;

export default function PerpsSignRoot() {
  const deviceIntentSignEnabled = useFeature("ptxPerpsDeviceIntentSign")?.enabled ?? false;
  const [pending, setPending] = useState<PendingSignRequest | null>(null);
  const lastIdRef = useRef(0);
  // Tracked outside React state so a request replaced or closed before its dialog renders still
  // gets an answer.
  const pendingRef = useRef<PendingSignRequest | null>(null);

  const clearPending = useCallback((id: number) => {
    if (pendingRef.current?.id === id) pendingRef.current = null;
    setPending(current => (current?.id === id ? null : current));
  }, []);
  const closeAll = useCallback(() => {
    pendingRef.current?.request.onCancel();
    pendingRef.current = null;
    setPending(null);
  }, []);

  const pendingId = pending?.id;
  const closeCurrent = useCallback(() => {
    if (pendingId !== undefined) clearPending(pendingId);
  }, [clearPending, pendingId]);

  useEffect(
    () =>
      registerPerpsSignOpener((request, manifest) => {
        pendingRef.current?.request.onCancel();
        lastIdRef.current += 1;
        const next = { id: lastIdRef.current, request, manifest };
        pendingRef.current = next;
        setPending(next);
      }),
    [],
  );

  useEffect(() => () => pendingRef.current?.request.onCancel(), []);

  useOnNavigateAway(pending !== null, closeAll);

  if (deviceIntentSignEnabled) {
    return pending ? (
      <PerpsSignExecutor
        key={pending.id}
        request={pending.request}
        manifest={pending.manifest}
        onClose={closeCurrent}
      />
    ) : null;
  }

  return <PerpsSignInnerDialog data={pending?.request ?? null} onClose={closeCurrent} />;
}
