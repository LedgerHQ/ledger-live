import React, { useCallback, useRef } from "react";
import { Dialog, DialogContent } from "@ledgerhq/lumen-ui-react";
import { useSelector, useDispatch } from "LLD/hooks/redux";
import { usePerpsSignViewModel, type PerpsSignData } from "./usePerpsSignViewModel";
import { PerpsSignView } from "./PerpsSignView";
import {
  selectIsPerpsSignOpen,
  closePerpsSign,
  getPerpsSignData,
  clearPerpsSignData,
} from "./perpsSignDialog";

function PerpsSignBody({ data, onClose }: { data: PerpsSignData; onClose: () => void }) {
  const viewModel = usePerpsSignViewModel(data, onClose);
  return <PerpsSignView {...viewModel} />;
}

export default function PerpsSignModal() {
  const dispatch = useDispatch();
  const isOpen = useSelector(selectIsPerpsSignOpen);

  const dataRef = useRef<PerpsSignData | null>(null);
  const currentData = getPerpsSignData();
  if (currentData) dataRef.current = currentData;

  const onClose = useCallback(() => {
    dispatch(closePerpsSign());
    clearPerpsSignData();
  }, [dispatch]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) onClose();
    },
    [onClose],
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent onInteractOutside={e => e.preventDefault()}>
        {dataRef.current ? <PerpsSignBody data={dataRef.current} onClose={onClose} /> : null}
      </DialogContent>
    </Dialog>
  );
}
