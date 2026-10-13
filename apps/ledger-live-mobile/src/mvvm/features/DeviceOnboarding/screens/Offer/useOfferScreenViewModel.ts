import { useTranslation } from "~/context/Locale";

export type OfferViewProps = Readonly<{
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

export type OfferScreenProps = Readonly<{
  onActivate: () => void;
  onSkip: () => void;
  onLearnMore: () => void;
  onQuit: () => void;
}>;

export function useOfferScreenViewModel({
  onActivate,
  onSkip,
  onLearnMore,
  onQuit,
}: OfferScreenProps): OfferViewProps {
  const { t } = useTranslation();

  return {
    title: t("deviceOnboarding.offer.title"),
    description: t("deviceOnboarding.offer.description"),
    learnMoreLabel: t("deviceOnboarding.offer.learnMore"),
    activateLabel: t("deviceOnboarding.offer.activate"),
    skipLabel: t("deviceOnboarding.offer.skip"),
    closeLabel: t("deviceOnboarding.checks.close"),
    onActivate,
    onSkip,
    onLearnMore,
    onQuit,
  };
}
