import { useCallback } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { closeReceiveAddressDialog, receiveFlowSelector } from "~/renderer/reducers/receiveFlow";

export function useReceiveAddressDialogViewModel() {
  const dispatch = useDispatch();
  const target = useSelector(receiveFlowSelector);
  const onClose = useCallback(() => dispatch(closeReceiveAddressDialog()), [dispatch]);
  return { isOpen: target !== null, onClose };
}

export type ReceiveAddressDialogViewProps = ReturnType<typeof useReceiveAddressDialogViewModel>;
