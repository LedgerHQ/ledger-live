import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import GenericStepConnectDevice from "~/renderer/modals/Send/steps/GenericStepConnectDevice";
import StepListNeuron, { StepListNeuronFooter } from "./ListNeuron";
import { StepProps, St } from "../types";
import StepManage from "./Manage";
import StepConfirmation from "../../components/Confirmation";
import { StepSelectFollowees } from "./SelectFollowees";
import { StepFollowSelectTopics } from "./FollowSelectTopics";
import { SetDissolveDelay } from "./SetDissolveDelay";
import { StakeMaturity } from "./StakeMaturity";
import { SplitNeuron } from "./SplitNeuron";
import { AddHotKey } from "./AddHotKey";

export function useSteps(): St[] {
  const { t } = useTranslation();
  return useMemo<St[]>(
    () => [
      {
        id: "device",
        label: t("cosmos.undelegation.flow.steps.device.title"),
        component: GenericStepConnectDevice as React.ComponentType<StepProps>,
        noScroll: true,
      },
      {
        id: "listNeuron",
        label: "Select neuron",
        component: StepListNeuron,
        footer: StepListNeuronFooter,
        noScroll: false,
      },
      {
        id: "followTopic",
        label: "Follow topics",
        component: StepFollowSelectTopics,
        onBack: ({ transitionTo }: StepProps) => {
          transitionTo("manage");
        },
        excludeFromBreadcrumb: true,
        noScroll: false,
      },
      {
        id: "setDissolveDelay",
        label: "Set dissolve delay",
        component: SetDissolveDelay,
        onBack: ({ transitionTo }: StepProps) => {
          transitionTo("manage");
        },
        excludeFromBreadcrumb: true,
        noScroll: false,
      },
      {
        id: "stakeMaturity",
        label: "Stake Maturity",
        component: StakeMaturity,
        onBack: ({ transitionTo }: StepProps) => {
          transitionTo("manage");
        },
        excludeFromBreadcrumb: true,
        noScroll: false,
      },
      {
        id: "selectFollowees",
        label: "Select followees",
        component: StepSelectFollowees,
        onBack: ({ transitionTo }: StepProps) => {
          transitionTo("followTopic");
        },
        excludeFromBreadcrumb: true,
        noScroll: false,
      },
      {
        id: "splitNeuron",
        label: "Split neuron",
        component: SplitNeuron,
        onBack: ({ transitionTo }: StepProps) => {
          transitionTo("manage");
        },
        excludeFromBreadcrumb: true,
        noScroll: true,
      },
      {
        id: "addHotKey",
        label: "Add hot key",
        component: AddHotKey,
        onBack: ({ transitionTo }: StepProps) => {
          transitionTo("manage");
        },
        excludeFromBreadcrumb: true,
        noScroll: true,
      },
      {
        id: "manageAction",
        label: "Manage neuron action",
        component: GenericStepConnectDevice as React.ComponentType<StepProps>,
        excludeFromBreadcrumb: true,
        noScroll: true,
      },
      {
        id: "manage",
        label: "Manage neuron",
        component: StepManage,
        onBack: ({ transitionTo }: StepProps) => {
          transitionTo("listNeuron");
        },
      },
      {
        id: "confirmation",
        label: "Confirmation",
        component: StepConfirmation as React.ComponentType<StepProps>,
        footer: StepListNeuronFooter,
        onBack: ({ transitionTo }: StepProps) => {
          transitionTo("listNeuron");
        },
      },
    ],
    [t],
  );
}
