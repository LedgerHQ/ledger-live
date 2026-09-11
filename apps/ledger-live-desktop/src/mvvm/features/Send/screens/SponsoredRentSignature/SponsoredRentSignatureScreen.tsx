import React from "react";
import DeviceAction from "~/renderer/components/DeviceAction";
import StepProgress from "~/renderer/components/StepProgress";
import { DeviceBlocker } from "~/renderer/components/DeviceAction/DeviceBlocker";
import {
  useSponsoredRentSignatureViewModel,
  type SponsoredRentSignatureResult,
} from "./hooks/useSponsoredRentSignatureViewModel";
import { SponsoredRentSignatureScreenView } from "./components/SponsoredRentSignatureScreenView";

/**
 * Floating SPONSORED_RENT_SIGNATURE step: TX-A of the two-signature Tronify sponsored send. Mirrors
 * apps/ledger-live-desktop/src/renderer/modals/SignRawTransaction/steps/GenericStepConnectDevice.tsx
 * (useRawTransactionAction + <DeviceAction>) rather than the broadcast-shaped SignatureScreen, since
 * this device signature submits to Tronify (startRentPayment), never broadcasts on-chain itself.
 */
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
  } = useSponsoredRentSignatureViewModel();

  // Memoized so <DeviceAction> receives a stable Result identity — an inline component recreated
  // every render is a fresh JSX type each time, which remounts the result subtree.
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

  // Crafting first (the rent order is still being built), then the device action once a request
  // exists; nothing while neither holds. Computed as statements rather than a nested ternary.
  let content: React.ReactNode = null;
  if (isCrafting) {
    content = <StepProgress>{craftingLabel}</StepProgress>;
  } else if (request) {
    content = (
      <DeviceAction action={action} request={request} Result={Result} onResult={onResult} />
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
