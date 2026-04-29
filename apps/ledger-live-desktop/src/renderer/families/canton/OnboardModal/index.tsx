import React, { useCallback, useMemo } from "react";
import { Trans } from "react-i18next";
import invariant from "invariant";
import Modal from "~/renderer/components/Modal";
import Stepper, { type Step } from "~/renderer/components/Stepper";
import StepOnboard, { StepOnboardFooter } from "./steps/StepOnboard";
import StepFinish, { StepFinishFooter } from "./steps/StepFinish";
import { useOnboardModalViewModel } from "./hooks/useOnboardModalViewModel";
import type { UserProps, StepProps, StepId } from "./types";
import { StepId as StepIdEnum } from "./types";
export type { UserProps } from "./types";

function OnboardModalView(viewModel: ReturnType<typeof useOnboardModalViewModel>) {
  const {
    device,
    currency,
    stepId,
    accountName,
    editedNames,
    creatableAccount,
    importableAccounts,
    isProcessing,
    onboardingResult,
    onboardingStatus,
    error,
    isReonboarding,
    transitionTo,
    onAddAccounts,
    onOnboardAccount,
    onRetryOnboardAccount,
  } = viewModel;

  invariant(device, "device is required");
  invariant(currency, "currency is required");
  invariant(creatableAccount, "creatableAccount is required");

  const steps: Step<StepId, StepProps>[] = useMemo(
    () => [
      {
        id: StepIdEnum.ONBOARD,
        label: <Trans i18nKey="families.canton.addAccount.onboard.title" />,
        component: StepOnboard,
        footer: StepOnboardFooter,
      },
      {
        id: StepIdEnum.FINISH,
        label: <Trans i18nKey="families.canton.addAccount.finish.title" />,
        component: StepFinish,
        footer: StepFinishFooter,
      },
    ],
    [],
  );

  const handleStepChange = useCallback(
    ({ id }: Step<StepId, StepProps>) => {
      transitionTo(id);
    },
    [transitionTo],
  );

  const stepperProps = {
    device,
    currency,
    accountName,
    editedNames,
    creatableAccount,
    importableAccounts,
    isProcessing,
    onboardingResult,
    onboardingStatus,
    error,
    isReonboarding,
    onAddAccounts,
    onOnboardAccount,
    onRetryOnboardAccount,
  };

  return (
    <Modal
      centered
      name="MODAL_CANTON_ONBOARD_ACCOUNT"
      preventBackdropClick={stepId === StepIdEnum.ONBOARD}
      render={({ onClose }) => (
        <Stepper
          title={
            <Trans
              i18nKey={
                isReonboarding
                  ? "families.canton.addAccount.reonboard.title"
                  : "families.canton.addAccount.title"
              }
            />
          }
          stepId={stepId}
          onStepChange={handleStepChange}
          onClose={onClose}
          steps={steps}
          noScroll={true}
          {...stepperProps}
        />
      )}
    />
  );
}

export default function OnboardModal(props: UserProps) {
  return <OnboardModalView {...useOnboardModalViewModel(props)} />;
}
