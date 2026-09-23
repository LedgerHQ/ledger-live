import React from "react";
import { VerifyAddressIntroView } from "./VerifyAddressIntroView";
import { VerifyAddressSuccessView } from "./VerifyAddressSuccessView";
import type { VerifyAddressProps } from "../../types";
import { useVerifyAddressViewModel } from "./useVerifyAddressViewModel";

export function VerifyAddress(props: VerifyAddressProps) {
  const {
    isIntroOpen,
    isSuccessOpen,
    introTitle,
    introDescription,
    verifyCta,
    successTitle,
    nextStepsLabel,
    nextSteps,
    gotItCta,
    onVerify,
    onGotIt,
    onClose,
  } = useVerifyAddressViewModel(props);

  return (
    <>
      <VerifyAddressIntroView
        isOpen={isIntroOpen}
        title={introTitle}
        description={introDescription}
        verifyCta={verifyCta}
        onVerify={onVerify}
        onClose={onClose}
      />
      <VerifyAddressSuccessView
        isOpen={isSuccessOpen}
        title={successTitle}
        nextStepsLabel={nextStepsLabel}
        nextSteps={nextSteps}
        gotItCta={gotItCta}
        onGotIt={onGotIt}
        onClose={onClose}
      />
    </>
  );
}
