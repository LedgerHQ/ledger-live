import React, { useCallback } from "react";
import { Dialog, DialogContent } from "@ledgerhq/lumen-ui-react";
import { usePerpsSignViewModel, type PerpsSignData } from "./usePerpsSignViewModel";
import { PerpsSignView } from "./PerpsSignView";
import { usePerpsSignState } from "./perpsSignDialog";

function PerpsSignBody({ data, onClose }: { data: PerpsSignData; onClose: () => void }) {
  const viewModel = usePerpsSignViewModel(data, onClose);
  return <PerpsSignView {...viewModel} />;
}

export default function PerpsSignModal() {
  const { data, closePerpsSign } = usePerpsSignState();
  const isOpen = data !== null;

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) closePerpsSign();
    },
    [closePerpsSign],
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent onInteractOutside={e => e.preventDefault()}>
        {data ? <PerpsSignBody data={data} onClose={closePerpsSign} /> : null}
      </DialogContent>
    </Dialog>
  );
}
