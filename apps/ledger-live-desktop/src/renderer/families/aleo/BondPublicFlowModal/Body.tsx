import React from "react";
import { Trans } from "react-i18next";
import { StepId, StepProps, St } from "./types";
import StepAmount, { StepAmountFooter } from "./steps/StepAmount";
import StepValidator, { StepValidatorFooter } from "./steps/StepValidator";
import GenericStepConnectDevice from "~/renderer/modals/Send/steps/GenericStepConnectDevice";
import StepConfirmation, { StepConfirmationFooter } from "./steps/StepConfirmation";
import { createStakingFlowBody, StakingFlowData } from "../shared/createStakingFlowBody";
import { DEFAULT_ALEO_VALIDATOR } from "../constants";
import { getAleoCurrencyConfig } from "../shared/utils";

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
    id: "amount",
    label: <Trans i18nKey="aleo.bond.flow.steps.amount.title" />,
    component: StepAmount,
    onBack: ({ transitionTo }: StepProps) => transitionTo("validator"),
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
  // Aleo allows one validator per address and the chain rejects a bond to a second one,
  // so an account with an open position can only ever top that validator up. Otherwise
  // start on default validator, whose address differs per network — seed nothing when the network
  // cannot be resolved, since an address from the other network matches no row.
  initialRecipient: account => {
    const bonded = account.aleoResources?.bondedValidator;
    if (bonded) return bonded;
    const networkType = getAleoCurrencyConfig(account.currency)?.networkType;
    return networkType ? DEFAULT_ALEO_VALIDATOR[networkType] : "";
  },
  // The withdrawal address is fixed to the user's own account and never exposed as a step.
  // This seeds it at transaction-creation time so getTransactionStatus — which validates the
  // field — never sees it empty; prepareTransaction re-pins it on every update as a backstop.
  withdrawalFromFresh: true,
});
