import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@ledgerhq/lumen-ui-react";
import DeviceAction from "~/renderer/components/DeviceAction";
import StepProgress from "~/renderer/components/StepProgress";
import { DeviceBlocker } from "~/renderer/components/DeviceAction/DeviceBlocker";
import { renderError } from "~/renderer/components/DeviceAction/rendering";
import { SimplifiedTransactionConfirm } from "../Signature/components/SimplifiedTransactionConfirm";
import { LockedDevicePrompt } from "../Signature/components/LockedDevicePrompt";
import {
  useSponsoredRentSignatureViewModel,
  type SponsoredRentSignatureResult,
} from "./hooks/useSponsoredRentSignatureViewModel";
import { SponsoredRentSignatureScreenView } from "./components/SponsoredRentSignatureScreenView";

export function SponsoredRentSignatureScreen() {
  const {
    isCrafting,
    craftingLabel,
    submittingLabel,
    strategyLabel,
    feeLabel,
    feeAmountLabel,
    request,
    action,
    onResult,
    signError,
    onRetrySign,
    cancelLabel,
    onCancel,
  } = useSponsoredRentSignatureViewModel();
  const { t } = useTranslation();

  // Stable identity: a new component type per render would remount DeviceAction's result.
  const Result = React.useCallback(
    (result: SponsoredRentSignatureResult) => {
      if (!("signedOperation" in result) || !result.signedOperation) return null;
      return (
        <StepProgress>
          <DeviceBlocker />
          {submittingLabel}
        </StepProgress>
      );
    },
    [submittingLabel],
  );

  let content: React.ReactNode = null;
  if (isCrafting) {
    content = <StepProgress>{craftingLabel}</StepProgress>;
  } else if (signError) {
    // Unmounting DeviceAction here is what makes Retry start a fresh sign attempt.
    content = (
      <>
        {renderError({ error: signError, t, onRetry: onRetrySign })}
        <Button
          appearance="gray"
          size="lg"
          isFull
          data-testid="send-sponsored-rent-signature-cancel"
          onClick={onCancel}
        >
          {cancelLabel}
        </Button>
      </>
    );
  } else if (request) {
    content = (
      <DeviceAction
        action={action}
        request={request}
        Result={Result}
        onResult={onResult}
        renderLockedDevice={({ device, onRetry }) =>
          device ? <LockedDevicePrompt deviceModelId={device.modelId} onRetry={onRetry} /> : null
        }
        renderDeviceSignatureRequested={({ device }) => (
          <SimplifiedTransactionConfirm device={device} />
        )}
      />
    );
  }

  return (
    <SponsoredRentSignatureScreenView
      strategyLabel={strategyLabel}
      feeLabel={feeLabel}
      feeAmountLabel={feeAmountLabel}
    >
      {content}
    </SponsoredRentSignatureScreenView>
  );
}
