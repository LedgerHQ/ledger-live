import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent } from "@ledgerhq/lumen-ui-react";
import { cancelWithdrawRequest } from "@ledgerhq/live-common/wallet-api/Perps/withdraw/request";
import { PerpsWithdrawView } from "./PerpsWithdrawView";
import type { PickedWithdrawAccount } from "@ledgerhq/live-common/wallet-api/Perps/withdraw/useWithdrawForm";
import { useIsDrawerOpen } from "LLD/features/Perps/hooks/useIsDrawerOpen";
import { useOnNavigateAway } from "LLD/features/Perps/hooks/useOnNavigateAway";
import {
  EMPTY_AMOUNT_TEXT,
  usePerpsWithdrawViewModel,
  type PerpsWithdrawData,
  type PerpsWithdrawFormState,
} from "./usePerpsWithdrawViewModel";

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

function PerpsWithdrawBody({
  data,
  onClose,
  form,
}: Readonly<{ data: PerpsWithdrawData; onClose: () => void; form: PerpsWithdrawFormState }>) {
  const viewModel = usePerpsWithdrawViewModel(data, onClose, form);
  return <PerpsWithdrawView {...viewModel} />;
}

export default function PerpsWithdrawRoot() {
  const [data, setData] = useState<PerpsWithdrawData | null>(null);
  const [openCount, setOpenCount] = useState(0);
  const [amountText, setAmountText] = useState(EMPTY_AMOUNT_TEXT);
  const [picked, setPicked] = useState<PickedWithdrawAccount | undefined>();
  const close = useCallback(() => setData(null), []);
  const isDrawerOpen = useIsDrawerOpen();

  // Each open remounts the form so a draft from the summary becomes its initial state.
  useEffect(
    () =>
      registerPerpsWithdrawOpener(next => {
        setData(next);
        setAmountText(next.draft?.amountText ?? EMPTY_AMOUNT_TEXT);
        setPicked(next.draft?.picked);
        setOpenCount(count => count + 1);
      }),
    [],
  );

  const form = useMemo(
    () => ({ amountText, setAmountText, picked, setPicked }),
    [amountText, picked],
  );

  const cancel = useCallback(() => {
    cancelWithdrawRequest();
    close();
  }, [close]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) cancel();
    },
    [cancel],
  );

  useOnNavigateAway(data !== null, cancel);

  return (
    // Hiding through `open` skips `onOpenChange`, so the pending withdraw request is kept.
    <Dialog open={data !== null && !isDrawerOpen} onOpenChange={handleOpenChange}>
      <DialogContent onInteractOutside={e => e.preventDefault()}>
        {data ? (
          <PerpsWithdrawBody key={openCount} data={data} onClose={close} form={form} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
