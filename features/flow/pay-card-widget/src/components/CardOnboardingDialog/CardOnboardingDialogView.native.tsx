import React, { memo } from "react";
import { CardOnboardingOption } from "./CardOnboardingOption/CardOnboardingOption";
import type { CardOnboardingDialogViewProps } from "./useCardOnboardingDialogViewModel";

export const CardOnboardingDialogView = memo(function CardOnboardingDialogView({
  options,
}: CardOnboardingDialogViewProps) {
  return (
    <>
      {options.map(option => (
        <CardOnboardingOption key={option.id} {...option} />
      ))}
    </>
  );
});
