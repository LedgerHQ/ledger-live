import React from "react";
import { ReceiveAddress } from "@features/flow-receive";
import { VerifyAddressExecutorLWD } from "LLD/features/Receive/verifyAddressIntent/VerifyAddressExecutorLWD";
import type { ReceiveAddressDialogViewModel } from "./useReceiveAddressDialogViewModel";

export function ReceiveAddressDialogView({
  isAddressVisible,
  receiveAddress,
  deviceIntent,
  acceptedDeviceModelIds,
}: ReceiveAddressDialogViewModel) {
  return (
    <>
      {isAddressVisible ? <ReceiveAddress {...receiveAddress} /> : null}
      {deviceIntent.selection ? (
        <VerifyAddressExecutorLWD
          selection={deviceIntent.selection}
          onReady={deviceIntent.onReady}
          onExit={deviceIntent.onExit}
          acceptedDeviceModelIds={acceptedDeviceModelIds}
        />
      ) : null}
    </>
  );
}
