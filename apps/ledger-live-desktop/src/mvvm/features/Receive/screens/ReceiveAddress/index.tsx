import React from "react";
import { ReceiveAddressDialogView } from "./ReceiveAddressDialogView";
import { useReceiveAddressDialogViewModel } from "./useReceiveAddressDialogViewModel";

const ReceiveAddressDialog = () => (
  <ReceiveAddressDialogView {...useReceiveAddressDialogViewModel()} />
);

export default ReceiveAddressDialog;
