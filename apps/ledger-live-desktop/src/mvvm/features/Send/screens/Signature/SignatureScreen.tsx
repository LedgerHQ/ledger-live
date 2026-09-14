import React from "react";
import { DialogBody } from "@ledgerhq/lumen-ui-react";
import type { SignedOperation } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import DeviceAction from "~/renderer/components/DeviceAction";
import { SimplifiedTransactionConfirm } from "./components/SimplifiedTransactionConfirm";
import { ZcashTransactionConfirm } from "~/renderer/families/bitcoin/ZcashTransactionConfirm";
import { useSignatureViewModel } from "./hooks/useSignatureViewModel";
import { LockedDevicePrompt } from "./components/LockedDevicePrompt";
import { PendingState } from "./components/PendingState";

const Result = (
  props:
    | {
        signedOperation: SignedOperation | undefined | null;
        device: Device;
      }
    | {
        transactionSignError: Error;
      },
) => {
  if (!("signedOperation" in props)) {
    return null;
  }
  // Show pending state after signature during broadcast
  return <PendingState messageKey="send.steps.confirmation.pending.title" />;
};

export const SignatureScreen = () => {
  const {
    account,
    transaction,
    action,
    request,
    onDeviceActionResult,
    finishWithError,
    onDeviceConfirmationShown,
  } = useSignatureViewModel();

  if (!account || !transaction || !request) {
    return null;
  }

  const isZcash = getAccountCurrency(account).id === "zcash";
  const zcashUnit = isZcash ? getAccountCurrency(account).units[0] : undefined;

  return (
    <DialogBody className="py-16">
      <div className="-mt-12 mb-24" data-testid="send-signature-step">
        <DeviceAction
          action={action}
          request={request}
          Result={Result}
          onResult={onDeviceActionResult}
          onError={finishWithError}
          analyticsPropertyFlow="send"
          renderLockedDevice={({ device, onRetry }) => {
            if (!device) return null;
            return <LockedDevicePrompt deviceModelId={device.modelId} onRetry={onRetry} />;
          }}
          renderDeviceSignatureRequested={({ device }) =>
            isZcash && zcashUnit ? (
              <ZcashTransactionConfirm
                device={device}
                transaction={transaction}
                unit={zcashUnit}
                onShown={onDeviceConfirmationShown}
              />
            ) : (
              <SimplifiedTransactionConfirm device={device} onShown={onDeviceConfirmationShown} />
            )
          }
        />
      </div>
    </DialogBody>
  );
};
