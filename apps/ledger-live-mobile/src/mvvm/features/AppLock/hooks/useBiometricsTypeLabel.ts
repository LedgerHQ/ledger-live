import { biometricsTypeKey, type BiometricsKind } from "@features/platform-app-lock";
import { useTranslation } from "~/context/Locale";

export function useBiometricsTypeLabel(kind: BiometricsKind | undefined): string {
  const { t } = useTranslation();

  const labelKey = kind ? biometricsTypeKey(kind) : undefined;

  return labelKey ? t(labelKey) : (kind ?? "");
}
