import React from "react";
import { Trans } from "react-i18next";
import { TRANSACTION_TYPE } from "@ledgerhq/live-common/families/aleo/constants";
import { StepId, StepProps, St } from "./types";
import StepSummary, { StepSummaryFooter } from "./steps/StepSummary";
import GenericStepConnectDevice from "~/renderer/modals/Send/steps/GenericStepConnectDevice";
import StepConfirmation, { StepConfirmationFooter } from "./steps/StepConfirmation";
import { createStakingFlowBody, StakingFlowData } from "../shared/createStakingFlowBody";

export type Data = StakingFlowData;

const steps: Array<St> = [
  {
    id: "summary",
    label: <Trans i18nKey="aleo.claim.flow.steps.summary.title" />,
    component: StepSummary,
    noScroll: true,
    footer: StepSummaryFooter,
  },
  {
    id: "connectDevice",
    label: <Trans i18nKey="aleo.claim.flow.steps.connectDevice.title" />,
    component: GenericStepConnectDevice,
    onBack: ({ transitionTo }: StepProps) => transitionTo("summary"),
  },
  {
    id: "confirmation",
    label: <Trans i18nKey="aleo.claim.flow.steps.confirmation.title" />,
    component: StepConfirmation,
    footer: StepConfirmationFooter,
  },
];

export default createStakingFlowBody<StepId>({
  steps,
  initialStepId: "summary",
  title: "aleo.claim.flow.title",
  trackCloseEvent: "CloseModalClaimUnbond",
  mode: TRANSACTION_TYPE.CLAIM_UNBOND_PUBLIC,
  initialRecipient: account => account.freshAddress,
});
