import { useCallback } from "react";
import {
  closeReceiveAddressDialog,
  selectReceiveAddressDialogTarget,
} from "@features/flow-receive/state";
import { useDispatch, useSelector } from "LLD/hooks/redux";

export function useReceiveAddressDialogViewModel() {
  const dispatch = useDispatch();
  const target = useSelector(selectReceiveAddressDialogTarget);
  const onClose = useCallback(() => dispatch(closeReceiveAddressDialog()), [dispatch]);
  return { isOpen: target !== null, onClose };
}

export type ReceiveAddressDialogViewProps = ReturnType<typeof useReceiveAddressDialogViewModel>;
