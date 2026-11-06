import { useTranslation } from "~/context/Locale";

type KaraokeViewModelInput = Readonly<{
  onClose: () => void;
}>;

export type KaraokeViewProps = Readonly<{
  closeLabel: string;
  onClose: () => void;
}>;

export function useKaraokeViewModel({ onClose }: KaraokeViewModelInput): KaraokeViewProps {
  const { t } = useTranslation();

  return {
    closeLabel: t("deviceOnboarding.checks.close"),
    onClose,
  };
}
