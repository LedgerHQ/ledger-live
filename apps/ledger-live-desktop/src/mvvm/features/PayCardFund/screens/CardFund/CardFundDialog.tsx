import React, { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent } from "@ledgerhq/lumen-ui-react";
import { CardFundView } from "./CardFundView";
import type { CardFundData } from "./types";
import { useCardFundViewModel } from "./useCardFundViewModel";

let opener: ((data: CardFundData) => void) | null = null;

function registerCardFundOpener(next: (data: CardFundData) => void): () => void {
  opener = next;
  return () => {
    opener = null;
  };
}

export function openCardFund(data: CardFundData): void {
  opener?.(data);
}

function CardFundBody({ data, onClose }: Readonly<{ data: CardFundData; onClose: () => void }>) {
  const viewModel = useCardFundViewModel(data, onClose);
  return <CardFundView {...viewModel} />;
}

export default function CardFundRoot() {
  const [data, setData] = useState<CardFundData | null>(null);
  const close = useCallback(() => setData(null), []);

  useEffect(() => registerCardFundOpener(setData), []);

  return (
    <Dialog open={data !== null} onOpenChange={open => !open && close()}>
      <DialogContent
        onInteractOutside={event => event.preventDefault()}
        onEscapeKeyDown={event => event.preventDefault()}
      >
        {data ? <CardFundBody data={data} onClose={close} /> : null}
      </DialogContent>
    </Dialog>
  );
}
