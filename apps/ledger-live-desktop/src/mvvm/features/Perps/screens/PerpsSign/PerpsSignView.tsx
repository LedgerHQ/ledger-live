import React from "react";
import { DialogHeader, DialogBody } from "@ledgerhq/lumen-ui-react";
import DeviceAction from "~/renderer/components/DeviceAction";
import { SimplifiedTransactionConfirm } from "LLD/features/Send/screens/Signature/components/SimplifiedTransactionConfirm";
import type { PerpsSignViewModel } from "./usePerpsSignViewModel";

export function PerpsSignView({
  phase,
  device,
  action,
  request,
  handleDeviceResult,
  handleDeviceError,
  handleOpenManager,
}: Readonly<PerpsSignViewModel>) {
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
      <DialogBody>
        <DeviceAction
          action={action}
          request={request}
          onResult={handleDeviceResult}
          onError={handleDeviceError}
          onOpenManager={handleOpenManager}
        />
      </DialogBody>
    </>
  );
}
