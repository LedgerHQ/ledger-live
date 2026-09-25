import { useCallback, useMemo, useState } from "react";
import { trackButtonClicked } from "@features/platform-pay-analytics";
import { useTranslation } from "@shared/i18n";
import type { CardOnboardingStepWithCopy } from "../CardOnboardingWidget/useOnboardingSteps";
import { getWalletPlatform } from "../getWalletPlatform";
import { getStepIcon } from "./getStepIcon";
import type {
  CardOnboardingOptionViewProps,
  StepStatus,
} from "../CardOnboardingOption/useCardOnboardingOptionViewModel";

const noop = () => {};

function toStepStatus(isDone: boolean, isFirstUndone: boolean): StepStatus {
  if (isDone) return "done";
  if (isFirstUndone) return "active";
  return "pending";
}

const STEP_ACTIONS: Record<string, () => void> = {
  "create-account": noop,
  "first-purchase": noop,
};

type Params = {
  isOpen: boolean;
  steps: CardOnboardingStepWithCopy[];
  completedCount: number;
  totalCount: number;
  onClose: () => void;
  onboardingCompleted: boolean;
  handleGotIt: () => void;
  onTopUp?: () => void;
  onChooseCardType?: () => void;
};

export type CardOnboardingDialogViewProps = {
  readonly isOpen: boolean;
  readonly dialogTitle: string;
  readonly gotItLabel: string;
  readonly options: CardOnboardingOptionViewProps[];
  readonly completedCount: number;
  readonly totalCount: number;
  readonly handleClose: () => void;
  readonly onboardingCompleted: boolean;
  readonly handleGotIt: () => void;
  readonly isAddToWalletSceneOpen: boolean;
  readonly onCloseAddToWalletScene: () => void;
};

export function useCardOnboardingDialogViewModel({
  isOpen,
  steps,
  completedCount,
  totalCount,
  onClose,
  onboardingCompleted,
  handleGotIt,
  onTopUp,
  onChooseCardType,
}: Params): CardOnboardingDialogViewProps {
  const { t } = useTranslation();
  const dialogTitle = t("payTab.cardOnboarding.dialog.title");
  const gotItLabel = t("payTab.cardOnboarding.dialog.gotIt");

  const [isAddToWalletSceneOpen, setIsAddToWalletSceneOpen] = useState(false);
  const onCloseAddToWalletScene = useCallback(() => setIsAddToWalletSceneOpen(false), []);
  const handleClose = useCallback(() => {
    setIsAddToWalletSceneOpen(false);
    onClose();
  }, [onClose]);

  const stepActions = useMemo<Record<string, () => void>>(
    () => ({
      ...STEP_ACTIONS,
      "choose-card-type": onChooseCardType ?? noop,
      "top-up-card": onTopUp ?? noop,
      "apple-google-pay": () => {
        trackButtonClicked({
          button: `add to ${getWalletPlatform().brand.toLowerCase()} pay`,
          page: "Pay",
        });
        setIsAddToWalletSceneOpen(true);
      },
    }),
    [onChooseCardType, onTopUp],
  );

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
        iconId: getStepIcon(step.id),
        onAction: stepActions[step.id] ?? noop,
      };
    });
  }, [steps, t, stepActions]);

  return {
    isOpen,
    dialogTitle,
    gotItLabel,
    options,
    completedCount,
    totalCount,
    handleClose,
    onboardingCompleted,
    handleGotIt,
    isAddToWalletSceneOpen,
    onCloseAddToWalletScene,
  };
}
