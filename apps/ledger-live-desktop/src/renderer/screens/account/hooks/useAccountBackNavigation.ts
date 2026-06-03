import { useCallback } from "react";
import { track } from "~/renderer/analytics/segment";
import { usePopNavigationBack } from "LLD/utils/usePopNavigationBack";
import { parseAccountBackPath } from "../utils/accountLocationState";

export type AccountBackNavigation = Readonly<{
  showBackButton: boolean;
  navigateBack: () => void;
}>;

export function useAccountBackNavigation(): AccountBackNavigation {
  const onBack = useCallback(() => {
    track("button_clicked", {
      button: "Back",
      page: "Page Account",
    });
  }, []);

  return usePopNavigationBack(parseAccountBackPath, onBack);
}
