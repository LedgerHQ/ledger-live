import React from "react";
import { Trans } from "react-i18next";
import StepConfirmation, {
  StepConfirmationFooter,
} from "../../ManageNeuronFlowModal/steps/StepConfirmation";
import StepManageAction from "../../neuronFlow/StepManageAction";
import type { Step, StepProps } from "../../neuronFlow/types";
import StepRefreshList, { StepRefreshListFooter } from "./StepRefreshList";

// This flow has no manage card to send a refused action back to, so Back returns to the list.
const ManageActionDevice = (props: StepProps) => (
  <StepManageAction {...props} backTo="listNeuron" />
);

export const steps: Step[] = [
  {
    id: "listNeuron",
    label: <Trans i18nKey="internetComputer.refreshVotingPowerFlow.listTitle" />,
    component: StepRefreshList,
    footer: StepRefreshListFooter,
  },
  {
    id: "manageAction",
    label: <Trans i18nKey="internetComputer.manageNeuronFlow.device.title" />,
    component: ManageActionDevice,
    onBack: ({ transitionTo }: StepProps) => transitionTo("listNeuron"),
    noScroll: true,
  },
  {
    id: "confirmation",
    label: <Trans i18nKey="internetComputer.manageNeuronFlow.confirmation.title" />,
    component: StepConfirmation,
    footer: StepConfirmationFooter,
  },
];
