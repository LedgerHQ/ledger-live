import { useNavigation, type NavigationProp, type ParamListBase } from "@react-navigation/native";
import { useTranslation } from "~/context/Locale";
import { useCompleteSeededOnboarding } from "LLM/features/DeviceOnboarding/hooks/useCompleteSeededOnboarding";
import { resetToPortfolio } from "LLM/features/DeviceOnboarding/utils/exitActions";

export type UnseededSuccessKaraokeScreenProps = Readonly<{
  wasReadOnlyAtEntry: boolean;
}>;

export type UnseededSuccessKaraokeViewProps = Readonly<{
  phrases: readonly string[];
  tapLabel: string;
  actionLabel: string;
  onAction: () => void;
}>;

export function useUnseededSuccessKaraokeViewModel({
  wasReadOnlyAtEntry,
}: UnseededSuccessKaraokeScreenProps): UnseededSuccessKaraokeViewProps {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const completeOnboarding = useCompleteSeededOnboarding(wasReadOnlyAtEntry);

  return {
    phrases: [
      t("deviceOnboarding.karaoke.success.allSet"),
      t("deviceOnboarding.karaoke.success.timeToExplore"),
    ],
    tapLabel: t("deviceOnboarding.karaoke.tapToContinue"),
    actionLabel: t("deviceOnboarding.karaoke.success.cta"),
    onAction: () => {
      completeOnboarding();
      resetToPortfolio(navigation);
    },
  };
}
