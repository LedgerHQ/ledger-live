import { biometricsTypeKey, type BiometricsKind } from "@features/platform-app-lock";
import { useTranslation } from "~/context/Locale";

export function useBiometricsTypeLabel(kind: BiometricsKind | undefined): string {
  const { t } = useTranslation();

  return kind ? t(biometricsTypeKey(kind), { defaultValue: kind }) : "";
}
