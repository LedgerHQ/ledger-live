import React from "react";
import { VerifyAddressIntroView } from "./VerifyAddressIntroView";
import { VerifyAddressSuccessView } from "./VerifyAddressSuccessView";
import type { VerifyAddressProps } from "../../types";
import { useVerifyAddressViewModel } from "./useVerifyAddressViewModel";

export function VerifyAddress(props: VerifyAddressProps) {
  const { isIntroOpen, isSuccessOpen, nextSteps, onVerify, onGotIt, onClose } =
    useVerifyAddressViewModel(props);

  return (
    <>
      <VerifyAddressIntroView
        isOpen={isIntroOpen}
        title={props.labels.introTitle}
        description={props.labels.introDescription}
        verifyCta={props.labels.verifyCta}
        onVerify={onVerify}
        onClose={onClose}
        bottomInset={props.bottomInset}
      />
      <VerifyAddressSuccessView
        isOpen={isSuccessOpen}
        title={props.labels.successTitle}
        nextStepsLabel={props.labels.nextStepsLabel}
        nextSteps={nextSteps}
        gotItCta={props.labels.gotItCta}
        onGotIt={onGotIt}
        onClose={onClose}
        bottomInset={props.bottomInset}
      />
    </>
  );
}
