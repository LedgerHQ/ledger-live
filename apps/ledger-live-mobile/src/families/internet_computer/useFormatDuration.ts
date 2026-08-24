import { secondsToDuration } from "@ledgerhq/live-common/families/internet_computer/neuron";
import { useCallback } from "react";
import { useTranslation } from "~/context/Locale";

const UNITS = ["years", "months", "days", "hours", "minutes"] as const;

/**
 * Formats a duration as its two largest non-zero units ("1 year, 3 months").
 *
 * The coin module returns the parts rather than a string so wording and pluralization stay here,
 * with the translations.
 */
export const useFormatDuration = () => {
  const { t } = useTranslation();
  return useCallback(
    (totalSeconds: bigint | number): string => {
      const parts = secondsToDuration(totalSeconds);
      const shown = UNITS.filter(unit => parts[unit] > 0)
        .slice(0, 2)
        .map(unit => t(`internetComputer.duration.${unit}`, { count: parts[unit] }));
      return shown.length ? shown.join(", ") : t("internetComputer.duration.lessThanAMinute");
    },
    [t],
  );
};
