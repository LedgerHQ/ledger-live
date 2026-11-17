import React, { Suspense } from "react";
import {
  ReceiveAddress,
  selectReceiveAddressDialogTarget,
  type ReceiveAddressDialogTarget,
} from "@features/flow-receive";
import { useSelector } from "LLD/hooks/redux";
import { useReceiveAddressDialogViewModel } from "./useReceiveAddressDialogViewModel";

function ReceiveAddressDialogContent({ target }: Readonly<{ target: ReceiveAddressDialogTarget }>) {
  return <ReceiveAddress {...useReceiveAddressDialogViewModel(target)} />;
}

/** Shows the receive address dialog while the receive flow targets an account. */
const ReceiveAddressDialog = () => {
  const target = useSelector(selectReceiveAddressDialogTarget);

  if (!target) return null;
  return (
    // The account's coin family loads on demand.
    <Suspense fallback={null}>
      <ReceiveAddressDialogContent target={target} />
    </Suspense>
  );
};

export default ReceiveAddressDialog;
