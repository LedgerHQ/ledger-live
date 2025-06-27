import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import GenericStepConnectDevice from "~/renderer/modals/Send/steps/GenericStepConnectDevice";
import StepListNeuron from "./ListNeuron";
import { StepProps, St } from "../types";
import StepConfirmation from "../../components/Confirmation";
import { ConfirmationFooter } from "../components/confirmationFooter";
export function useSteps(): St[] {
  const { t } = useTranslation();
  return useMemo<St[]>(
    () => [
      {
        id: "listNeuron",
        label: "Neurons",
        component: StepListNeuron,
        noScroll: true,
        footer: ConfirmationFooter,
      },
      {
        id: "device",
        label: t("cosmos.undelegation.flow.steps.device.title"),
        component: GenericStepConnectDevice as React.ComponentType<StepProps>,
        noScroll: true,
      },
      {
        id: "confirmation",
        label: "Confirmation",
        component: StepConfirmation as React.ComponentType<StepProps>,
        onBack: ({ transitionTo }: StepProps) => {
          transitionTo("listNeuron");
        },
        footer: ConfirmationFooter,
      },
    ],
    [t],
  );
}
