import React from "react";
import { Spot } from "@ledgerhq/lumen-ui-react";
import { ShieldLock } from "@ledgerhq/lumen-ui-react/symbols";
import { VerifyAddressDialog } from "./VerifyAddressDialog.web";
import type { VerifyAddressSuccessViewProps } from "../../types";

export function VerifyAddressSuccessView({
  isOpen,
  title,
  nextStepsLabel,
  nextSteps,
  gotItCta,
  onGotIt,
  onClose,
}: VerifyAddressSuccessViewProps) {
  return (
    <VerifyAddressDialog
      isOpen={isOpen}
      onClose={onClose}
      contentTestId="pay-card-verify-address-success"
      icon={ShieldLock}
      title={title}
      ctaLabel={gotItCta}
      onCta={onGotIt}
      ctaTestId="pay-card-verify-address-got-it-cta"
    >
      <div className="flex flex-col gap-16 rounded-md bg-surface p-16">
        <span className="body-2 text-muted">{nextStepsLabel}</span>
        {nextSteps.map(step => (
          <div key={step.index} className="flex flex-row items-center justify-start gap-12">
            <Spot appearance="number" number={step.index} size={32} />
            <span className="body-2 text-base">{step.label}</span>
          </div>
        ))}
      </div>
    </VerifyAddressDialog>
  );
}
