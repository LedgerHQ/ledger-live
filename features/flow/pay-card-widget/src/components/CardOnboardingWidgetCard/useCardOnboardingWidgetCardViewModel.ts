import { useTranslation } from "@shared/i18n";

type Params = {
  completedCount: number;
  totalCount: number;
  onOpen: () => void;
  onboardingCompleted: boolean;
};

export type CardOnboardingWidgetCardViewProps = {
  readonly title: string;
  readonly completedCount: number;
  readonly totalCount: number;
  readonly handleOpenDialog: () => void;
  readonly onboardingCompleted: boolean;
};

export function useCardOnboardingWidgetCardViewModel({
  completedCount,
  totalCount,
  onOpen,
  onboardingCompleted,
}: Params): CardOnboardingWidgetCardViewProps {
  const { t } = useTranslation();
  const title = onboardingCompleted
    ? t("payTab.cardOnboarding.widget.allDone")
    : t("payTab.cardOnboarding.widget.title");

  return { title, completedCount, totalCount, handleOpenDialog: onOpen, onboardingCompleted };
}
