import { useMemo } from "react";
import { useTranslation } from "@shared/i18n";

export type RegionLabels = Readonly<{
  title: string;
  description: string;
  dialogTitle: string;
  dialogDescription: string;
}>;

/** Wording of the Region row and dialog, on desktop only. */
export function useRegionLabels(): RegionLabels {
  const { t } = useTranslation();
  return useMemo(
    () => ({
      title: t("settings.general.region.title"),
      description: t("settings.general.region.description"),
      dialogTitle: t("settings.general.region.dialogTitle"),
      dialogDescription: t("settings.general.region.dialogDescription"),
    }),
    [t],
  );
}
