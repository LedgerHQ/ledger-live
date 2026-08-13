import React from "react";
import { Trans } from "react-i18next";
import GenericStepConnectDevice from "~/renderer/modals/Send/steps/GenericStepConnectDevice";
import StepConfirmation, {
  StepConfirmationFooter,
} from "../../ManageNeuronFlowModal/steps/StepConfirmation";
import type { Step, StepProps } from "../../neuronFlow/types";
import StepRefreshList, { StepRefreshListFooter } from "./StepRefreshList";

const ConnectDevice = GenericStepConnectDevice as unknown as React.ComponentType<StepProps>;

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
    component: ConnectDevice,
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
