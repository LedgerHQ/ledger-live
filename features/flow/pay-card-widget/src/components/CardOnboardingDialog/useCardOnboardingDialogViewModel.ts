import { useMemo } from "react";
import { useTranslation } from "@shared/i18n";
import type { PayCardOnboardingStep } from "@domain/api-card-management";
import type {
  CardOnboardingOptionViewProps,
  StepStatus,
} from "./CardOnboardingOption/useCardOnboardingOptionViewModel";

const noop = () => {};

function toStepStatus(isDone: boolean, isFirstUndone: boolean): StepStatus {
  if (isDone) return "done";
  if (isFirstUndone) return "active";
  return "pending";
}

// None of the steps has a destination wired yet: each one keeps its own entry so it can be
// replaced independently, and unknown ids coming from the backend still get a handler.
const STEP_ACTIONS: Record<string, () => void> = {
  "create-account": noop,
  "choose-card-type": noop,
  "top-up-card": noop,
  "first-purchase": noop,
  "apple-google-pay": noop,
};

type Params = {
  isOpen: boolean;
  steps: PayCardOnboardingStep[];
  onClose: () => void;
  onboardingCompleted: boolean;
  handleGotIt: () => void;
};

export type CardOnboardingDialogViewProps = {
  readonly isOpen: boolean;
  readonly dialogTitle: string;
  readonly options: CardOnboardingOptionViewProps[];
  readonly completedCount: number;
  readonly totalCount: number;
  readonly handleClose: () => void;
  readonly onboardingCompleted: boolean;
  readonly handleGotIt: () => void;
};

export function useCardOnboardingDialogViewModel({
  isOpen,
  steps,
  onClose,
  onboardingCompleted,
  handleGotIt,
}: Params): CardOnboardingDialogViewProps {
  const { t } = useTranslation();
  const dialogTitle = t("payTab.cardOnboarding.dialog.title");

  const options = useMemo<CardOnboardingOptionViewProps[]>(() => {
    const firstUndoneIndex = steps.findIndex(s => !s.isDone);
    return steps.map((step, index) => {
      const status = toStepStatus(step.isDone, index === firstUndoneIndex);
      return {
        id: step.id,
        title: step.title,
        description: step.isDone
          ? t("payTab.cardOnboarding.dialog.stepComplete")
          : step.description,
        status,
        iconId: step.id,
        onAction: STEP_ACTIONS[step.id] ?? noop,
      };
    });
  }, [steps, t]);

  const completedCount = options.filter(o => o.status === "done").length;
  const totalCount = options.length;

  return {
    isOpen,
    dialogTitle,
    options,
    completedCount,
    totalCount,
    handleClose: onClose,
    onboardingCompleted,
    handleGotIt,
  };
}
