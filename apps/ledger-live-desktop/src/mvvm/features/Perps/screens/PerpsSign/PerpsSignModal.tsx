import React, { useCallback, useRef } from "react";
import { Dialog, DialogContent } from "@ledgerhq/lumen-ui-react";
import { useSelector, useDispatch } from "LLD/hooks/redux";
import { isModalOpened, getModalData } from "~/renderer/reducers/modals";
import { closeModal } from "~/renderer/actions/modals";
import { usePerpsSignViewModel, type PerpsSignData } from "./usePerpsSignViewModel";
import { PerpsSignView } from "./PerpsSignView";

export type { PerpsSignData };

function PerpsSignBody({ data, onClose }: { data: PerpsSignData; onClose: () => void }) {
  const viewModel = usePerpsSignViewModel(data, onClose);
  return <PerpsSignView {...viewModel} />;
}

export default function PerpsSignModal() {
  const dispatch = useDispatch();
  const isOpen = useSelector(state => isModalOpened(state, "MODAL_PERPS_SIGNING"));
  const data = useSelector(state => getModalData(state, "MODAL_PERPS_SIGNING"));

  const dataRef = useRef(data);
  if (data) dataRef.current = data;

  const onClose = useCallback(() => {
    dispatch(closeModal("MODAL_PERPS_SIGNING"));
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
