import React, { useCallback, useRef } from "react";
import { Dialog, DialogContent } from "@ledgerhq/lumen-ui-react";
import { useSelector, useDispatch } from "LLD/hooks/redux";
import { usePerpsSignViewModel, type PerpsSignData } from "./usePerpsSignViewModel";
import { PerpsSignView } from "./PerpsSignView";
import { selectIsPerpsSignOpen, selectPerpsSignData, closePerpsSign } from "./perpsSignDialog";

function PerpsSignBody({ data, onClose }: { data: PerpsSignData; onClose: () => void }) {
  const viewModel = usePerpsSignViewModel(data, onClose);
  return <PerpsSignView {...viewModel} />;
}

export default function PerpsSignModal() {
  const dispatch = useDispatch();
  const isOpen = useSelector(selectIsPerpsSignOpen);
  const data = useSelector(selectPerpsSignData);

  const dataRef = useRef<PerpsSignData | null>(null);
  if (data) dataRef.current = data;

  const onClose = useCallback(() => {
    dispatch(closePerpsSign());
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
