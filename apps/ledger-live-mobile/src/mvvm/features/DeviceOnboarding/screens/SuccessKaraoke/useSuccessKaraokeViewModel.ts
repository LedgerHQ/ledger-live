import { useTranslation } from "~/context/Locale";

export type SuccessKaraokeScreenProps = Readonly<{
  onFinish: () => void;
}>;

export type SuccessKaraokeViewProps = Readonly<{
  phrases: readonly string[];
  tapLabel: string;
  onFinish: () => void;
}>;

export function useSuccessKaraokeViewModel({
  onFinish,
}: SuccessKaraokeScreenProps): SuccessKaraokeViewProps {
  const { t } = useTranslation();

  return {
    phrases: [
      t("deviceOnboarding.karaoke.success.ready"),
      t("deviceOnboarding.karaoke.success.walletReady"),
    ],
    tapLabel: t("deviceOnboarding.karaoke.tapToContinue"),
    onFinish,
  };
}
