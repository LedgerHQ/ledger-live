import React, { useCallback } from "react";
import {
  ReceiveAddress,
  closeReceiveAddressDialog,
  selectReceiveAddressDialogTarget,
} from "@features/flow-receive";
import { useDispatch, useSelector } from "LLD/hooks/redux";

/** Shows the receive address dialog while the receive flow targets an account. */
const ReceiveAddressDialog = () => {
  const dispatch = useDispatch();
  const target = useSelector(selectReceiveAddressDialogTarget);
  const onClose = useCallback(() => dispatch(closeReceiveAddressDialog()), [dispatch]);

  if (!target) return null;
  return (
    <ReceiveAddress accountUUID={target.accountUUID} assetId={target.assetId} onClose={onClose} />
  );
};

export default ReceiveAddressDialog;
