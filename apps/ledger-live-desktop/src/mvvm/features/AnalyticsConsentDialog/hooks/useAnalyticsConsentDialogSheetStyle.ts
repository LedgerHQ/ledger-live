import { useMemo } from "react";
import { useTheme } from "styled-components";

/** Light: black @ 30%; dark: white @ 30% — matches react-ui palettes (see shared/palettes). */
export function useAnalyticsConsentDialogSheetStyle() {
  const theme = useTheme();
  return useMemo(
    () => ({
      backgroundImage: `radial-gradient(43.51% 33.05% at 50.47% 0.14%, ${theme.colors.opacityDefault.c30} 0%, transparent 100%)`,
      backgroundSize: "100% 100%" as const,
      backgroundRepeat: "no-repeat" as const,
    }),
    [theme.colors.opacityDefault.c30],
  );
}
