import { useTranslation } from "@shared/i18n";
import { biometricsTypeKey } from "../biometricsType";
import type { BiometricsKind } from "../biometricsTypes";

export function useBiometricsTypeLabel(kind: BiometricsKind | undefined): string {
  const { t } = useTranslation();

  const labelKey = kind ? biometricsTypeKey(kind) : undefined;

  return labelKey ? t(labelKey) : (kind ?? "");
}
