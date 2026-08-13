import React from "react";
import { Trans } from "react-i18next";
import GenericStepConnectDevice from "~/renderer/modals/Send/steps/GenericStepConnectDevice";
import StepAddHotKey, { StepAddHotKeyFooter } from "./StepAddHotKey";
import StepConfirmation, { StepConfirmationFooter } from "./StepConfirmation";
import StepFollowTopic from "./StepFollowTopic";
import StepListNeuron, { StepListNeuronFooter } from "./StepListNeuron";
import StepManage from "./StepManage";
import StepSelectFollowees, { StepSelectFolloweesFooter } from "./StepSelectFollowees";
import StepSetDissolveDelay, { StepSetDissolveDelayFooter } from "./StepSetDissolveDelay";
import StepSplitNeuron, { StepSplitNeuronFooter } from "./StepSplitNeuron";
import StepStakeMaturity, { StepStakeMaturityFooter } from "./StepStakeMaturity";
import type { Step, StepProps } from "../../neuronFlow/types";

// GenericStepConnectDevice is typed against the generated union of every family's Transaction; the
// flow narrows it to the ICP one, which the union does not track.
const ConnectDevice = GenericStepConnectDevice as unknown as React.ComponentType<StepProps>;

const backToManage = ({ transitionTo }: StepProps) => transitionTo("manage");

/**
 * Breadcrumb is Neurons → Manage → Device → Confirmation. The steps that collect input for a single
 * operation are excluded from it: they are detours off the manage screen, not stages of one journey.
 */
export const steps: Step[] = [
  {
    id: "listNeuron",
    label: <Trans i18nKey="internetComputer.manageNeuronFlow.listNeuron.title" />,
    component: StepListNeuron,
    footer: StepListNeuronFooter,
  },
  {
    id: "manage",
    label: <Trans i18nKey="internetComputer.manageNeuronFlow.manage.title" />,
    component: StepManage,
    onBack: ({ transitionTo }: StepProps) => transitionTo("listNeuron"),
  },
  {
    id: "device",
    label: <Trans i18nKey="internetComputer.manageNeuronFlow.device.title" />,
    component: ConnectDevice,
    onBack: ({ transitionTo }: StepProps) => transitionTo("listNeuron"),
    excludeFromBreadcrumb: true,
    noScroll: true,
  },
  {
    id: "setDissolveDelay",
    label: <Trans i18nKey="internetComputer.manageNeuronFlow.setDissolveDelay.title" />,
    component: StepSetDissolveDelay,
    footer: StepSetDissolveDelayFooter,
    onBack: backToManage,
    excludeFromBreadcrumb: true,
  },
  {
    id: "stakeMaturity",
    label: <Trans i18nKey="internetComputer.manageNeuronFlow.stakeMaturity.title" />,
    component: StepStakeMaturity,
    footer: StepStakeMaturityFooter,
    onBack: backToManage,
    excludeFromBreadcrumb: true,
  },
  {
    id: "splitNeuron",
    label: <Trans i18nKey="internetComputer.manageNeuronFlow.splitNeuron.title" />,
    component: StepSplitNeuron,
    footer: StepSplitNeuronFooter,
    onBack: backToManage,
    excludeFromBreadcrumb: true,
  },
  {
    id: "addHotKey",
    label: <Trans i18nKey="internetComputer.manageNeuronFlow.addHotKey.title" />,
    component: StepAddHotKey,
    footer: StepAddHotKeyFooter,
    onBack: backToManage,
    excludeFromBreadcrumb: true,
  },
  {
    id: "followTopic",
    label: <Trans i18nKey="internetComputer.manageNeuronFlow.followTopic.title" />,
    component: StepFollowTopic,
    onBack: backToManage,
    excludeFromBreadcrumb: true,
  },
  {
    id: "selectFollowees",
    label: <Trans i18nKey="internetComputer.manageNeuronFlow.selectFollowees.title" />,
    component: StepSelectFollowees,
    footer: StepSelectFolloweesFooter,
    onBack: ({ transitionTo }: StepProps) => transitionTo("followTopic"),
    excludeFromBreadcrumb: true,
  },
  {
    id: "manageAction",
    label: <Trans i18nKey="internetComputer.manageNeuronFlow.device.title" />,
    component: ConnectDevice,
    onBack: backToManage,
    noScroll: true,
  },
  {
    id: "confirmation",
    label: <Trans i18nKey="internetComputer.manageNeuronFlow.confirmation.title" />,
    component: StepConfirmation,
    footer: StepConfirmationFooter,
  },
];
