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
        label: t("internetComputer.common.connectDevice.title"),
        component: GenericStepConnectDevice as React.ComponentType<StepProps>,
        noScroll: true,
      },
      {
        id: "listNeuron",
        label: t("internetComputer.manageNeuronFlow.listNeuron.title"),
        component: StepListNeuron,
        footer: StepListNeuronFooter,
        noScroll: false,
      },
      {
        id: "followTopic",
        label: t("internetComputer.manageNeuronFlow.selectTopics.title"),
        component: StepFollowSelectTopics,
        onBack: ({ transitionTo }: StepProps) => {
          transitionTo("manage");
        },
        excludeFromBreadcrumb: true,
        noScroll: false,
      },
      {
        id: "setDissolveDelay",
        label: t("internetComputer.manageNeuronFlow.setDissolveDelay.title"),
        component: SetDissolveDelay,
        onBack: ({ transitionTo }: StepProps) => {
          transitionTo("manage");
        },
        excludeFromBreadcrumb: true,
        noScroll: false,
      },
      {
        id: "stakeMaturity",
        label: t("internetComputer.manageNeuronFlow.stakeMaturity.title"),
        component: StakeMaturity,
        onBack: ({ transitionTo }: StepProps) => {
          transitionTo("manage");
        },
        excludeFromBreadcrumb: true,
        noScroll: false,
      },
      {
        id: "selectFollowees",
        label: t("internetComputer.manageNeuronFlow.selectFollowees.altTitle"),
        component: StepSelectFollowees,
        onBack: ({ transitionTo }: StepProps) => {
          transitionTo("followTopic");
        },
        excludeFromBreadcrumb: true,
        noScroll: false,
      },
      {
        id: "splitNeuron",
        label: t("internetComputer.manageNeuronFlow.splitNeuron.title"),
        component: SplitNeuron,
        onBack: ({ transitionTo }: StepProps) => {
          transitionTo("manage");
        },
        excludeFromBreadcrumb: true,
        noScroll: true,
      },
      {
        id: "addHotKey",
        label: t("internetComputer.manageNeuronFlow.addHotKey.title"),
        component: AddHotKey,
        onBack: ({ transitionTo }: StepProps) => {
          transitionTo("manage");
        },
        excludeFromBreadcrumb: true,
        noScroll: true,
      },
      {
        id: "manageAction",
        label: t("internetComputer.manageNeuronFlow.manageAction.title"),
        component: GenericStepConnectDevice as React.ComponentType<StepProps>,
        excludeFromBreadcrumb: true,
        noScroll: true,
      },
      {
        id: "manage",
        label: t("internetComputer.manageNeuronFlow.manage.title"),
        component: StepManage,
        onBack: ({ transitionTo }: StepProps) => {
          transitionTo("listNeuron");
        },
      },
      {
        id: "confirmation",
        label: t("internetComputer.common.confirmation"),
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
