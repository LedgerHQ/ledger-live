import { useTranslation } from "~/context/Locale";

export type SyncOfferViewProps = Readonly<{
  title: string;
  description: string;
  learnMoreLabel: string;
  activateLabel: string;
  skipLabel: string;
  closeLabel: string;
  onActivate: () => void;
  onSkip: () => void;
  onLearnMore: () => void;
  onQuit: () => void;
}>;

export type SyncOfferScreenProps = Readonly<{
  onActivate: () => void;
  onSkip: () => void;
  onLearnMore: () => void;
  onQuit: () => void;
}>;

export function useSyncOfferScreenViewModel({
  onActivate,
  onSkip,
  onLearnMore,
  onQuit,
}: SyncOfferScreenProps): SyncOfferViewProps {
  const { t } = useTranslation();

  return {
    title: t("deviceOnboarding.syncOffer.title"),
    description: t("deviceOnboarding.syncOffer.description"),
    learnMoreLabel: t("deviceOnboarding.syncOffer.learnMore"),
    activateLabel: t("deviceOnboarding.syncOffer.activate"),
    skipLabel: t("deviceOnboarding.syncOffer.skip"),
    closeLabel: t("deviceOnboarding.checks.close"),
    onActivate,
    onSkip,
    onLearnMore,
    onQuit,
  };
}
