import React, { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent } from "@ledgerhq/lumen-ui-react";
import { CardTopUpView } from "./CardTopUpView";
import type { CardTopUpData } from "./types";
import { useCardTopUpViewModel } from "./useCardTopUpViewModel";

let opener: ((data: CardTopUpData) => void) | null = null;

function registerCardTopUpOpener(next: (data: CardTopUpData) => void): () => void {
  opener = next;
  return () => {
    opener = null;
  };
}

export function openCardTopUp(data: CardTopUpData): void {
  opener?.(data);
}

function CardTopUpBody({ data, onClose }: Readonly<{ data: CardTopUpData; onClose: () => void }>) {
  const viewModel = useCardTopUpViewModel(data, onClose);
  return <CardTopUpView {...viewModel} />;
}

export default function CardTopUpRoot() {
  const [data, setData] = useState<CardTopUpData | null>(null);
  const close = useCallback(() => setData(null), []);

  useEffect(() => registerCardTopUpOpener(setData), []);

  return (
    <Dialog open={data !== null} onOpenChange={open => !open && close()}>
      <DialogContent
        onInteractOutside={event => event.preventDefault()}
        onEscapeKeyDown={event => event.preventDefault()}
      >
        {data ? <CardTopUpBody data={data} onClose={close} /> : null}
      </DialogContent>
    </Dialog>
  );
}
