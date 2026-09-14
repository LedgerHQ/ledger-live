import React from "react";
import { DialogBody } from "@ledgerhq/lumen-ui-react";
import type { SignedOperation } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { getAccountCurrency, getMainAccount } from "@ledgerhq/live-common/account/index";
import DeviceAction from "~/renderer/components/DeviceAction";
import { SimplifiedTransactionConfirm } from "./components/SimplifiedTransactionConfirm";
import { useLLDCoinFamily } from "~/renderer/families";
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
    parentAccount,
    transaction,
    action,
    request,
    onDeviceActionResult,
    finishWithError,
    onDeviceConfirmationShown,
  } = useSignatureViewModel();
  const familyName = account ? getMainAccount(account, parentAccount).currency.family : undefined;
  const DeviceSignatureRequested = useLLDCoinFamily(familyName).SendDeviceSignatureRequested;

  if (!account || !transaction || !request) {
    return null;
  }

  const currency = getAccountCurrency(account);

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
          renderDeviceSignatureRequested={({ device }) => {
            const fallback = (
              <SimplifiedTransactionConfirm device={device} onShown={onDeviceConfirmationShown} />
            );
            if (!DeviceSignatureRequested) return fallback;
            return (
              <DeviceSignatureRequested
                device={device}
                transaction={transaction}
                unit={currency.units[0]}
                currencyId={currency.id}
                onShown={onDeviceConfirmationShown}
                fallback={fallback}
              />
            );
          }}
        />
      </div>
    </DialogBody>
  );
};
