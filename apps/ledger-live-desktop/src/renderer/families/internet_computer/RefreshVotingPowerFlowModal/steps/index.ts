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
        label: t("internetComputer.common.neurons"),
        component: StepListNeuron,
        noScroll: true,
        footer: ConfirmationFooter,
      },
      {
        id: "device",
        label: t("internetComputer.common.connectDevice.title"),
        component: GenericStepConnectDevice as React.ComponentType<StepProps>,
        noScroll: true,
      },
      {
        id: "confirmation",
        label: t("internetComputer.common.confirmation"),
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
