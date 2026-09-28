import type { TFunction } from "i18next";
import React from "react";
import StepHeader from "~/components/StepHeader";

// Both ICP flows end the same way — pick a device, sign, see the result — so the counter only ever
// covers that tail. In the manage flow the action screens are detours off the neuron rather than a
// fixed sequence, which is why they all share step 1.
const totalSteps = "3";

/**
 * Header options for one screen of an ICP flow, shared by both navigators.
 *
 * Module-level on purpose: defining the `headerTitle` component inside a navigator makes React
 * remount the header on every parent render, and Sonar flags it (S6478).
 */
export const stepHeaderOptions = (t: TFunction, title: string, currentStep?: string) => ({
  headerTitle: () => (
    <StepHeader
      title={title}
      subtitle={
        currentStep ? t("send.stepperHeader.stepRange", { currentStep, totalSteps }) : undefined
      }
    />
  ),
});
