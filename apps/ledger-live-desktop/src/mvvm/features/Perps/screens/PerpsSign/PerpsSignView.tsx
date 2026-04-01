import React from "react";
import { DialogHeader, DialogBody } from "@ledgerhq/lumen-ui-react";
import DeviceAction from "~/renderer/components/DeviceAction";
import { SimplifiedTransactionConfirm } from "LLD/features/Send/screens/Signature/components/SimplifiedTransactionConfirm";
import type { PerpsSignViewModel } from "./usePerpsSignViewModel";

export function PerpsSignView({
  phase,
  closing,
  device,
  action,
  request,
  handleDeviceResult,
  handleDeviceError,
}: PerpsSignViewModel) {
  if (phase === "sign" && device) {
    return (
      <>
        <DialogHeader />
        <SimplifiedTransactionConfirm device={device} />
      </>
    );
  }

  return (
    <>
      <DialogHeader />
      <DialogBody
        className={`flex items-center justify-center px-32 ${closing ? "invisible" : ""}`}
      >
        <DeviceAction
          action={action}
          request={request}
          onResult={handleDeviceResult}
          onError={handleDeviceError}
        />
      </DialogBody>
    </>
  );
}
