import React from "react";
import { Trans } from "react-i18next";
import { StepId, StepProps, St } from "./types";
import StepAmount, { StepAmountFooter } from "./steps/StepAmount";
import StepValidator, { StepValidatorFooter } from "./steps/StepValidator";
import StepWithdrawal, { StepWithdrawalFooter } from "./steps/StepWithdrawal";
import GenericStepConnectDevice from "~/renderer/modals/Send/steps/GenericStepConnectDevice";
import StepConfirmation, { StepConfirmationFooter } from "./steps/StepConfirmation";
import { createStakingFlowBody, StakingFlowData } from "../shared/createStakingFlowBody";

export type Data = StakingFlowData;

const steps: Array<St> = [
  {
    id: "validator",
    label: <Trans i18nKey="aleo.bond.flow.steps.validator.title" />,
    component: StepValidator,
    noScroll: true,
    footer: StepValidatorFooter,
  },
  {
    id: "withdrawal",
    label: <Trans i18nKey="aleo.bond.flow.steps.withdrawal.title" />,
    component: StepWithdrawal,
    onBack: ({ transitionTo }: StepProps) => transitionTo("validator"),
    noScroll: true,
    footer: StepWithdrawalFooter,
  },
  {
    id: "amount",
    label: <Trans i18nKey="aleo.bond.flow.steps.amount.title" />,
    component: StepAmount,
    onBack: ({ transitionTo }: StepProps) => transitionTo("withdrawal"),
    noScroll: true,
    footer: StepAmountFooter,
  },
  {
    id: "connectDevice",
    label: <Trans i18nKey="aleo.bond.flow.steps.connectDevice.title" />,
    component: GenericStepConnectDevice,
    onBack: ({ transitionTo }: StepProps) => transitionTo("amount"),
  },
  {
    id: "confirmation",
    label: <Trans i18nKey="aleo.bond.flow.steps.confirmation.title" />,
    component: StepConfirmation,
    footer: StepConfirmationFooter,
  },
];

export default createStakingFlowBody<StepId>({
  steps,
  initialStepId: "validator",
  title: "aleo.bond.flow.title",
  trackCloseEvent: "CloseModalBondPublic",
  mode: "bond_public",
  recipientFromFresh: false,
  withdrawalFromFresh: true,
});
