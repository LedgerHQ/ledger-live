import { useCallback, useEffect, useMemo } from "react";
import { track, trackPage } from "@shared/analytics";
import { OsUpdateFlowMode } from "../../types/OsUpdateFlowMode";
import { getSharedAnalytics } from "../../analytics/getSharedAnalytics";
import { OsUpdateButton, OsUpdatePage } from "../../analytics/analyticsTypes";

export type BootloaderDiscoveredProps = Readonly<{
  /** The Ledger Wallet model id sent in analytics. */
  analyticsModelId: string;
  wired: boolean;
  /** Opens the OS update flow in bootloader repair mode. */
  onContinue: () => void;
}>;

export function useBootloaderDiscoveredViewModel({
  analyticsModelId,
  wired,
  onContinue: openRepairFlow,
}: BootloaderDiscoveredProps) {
  const sharedAnalytics = useMemo(
    () =>
      getSharedAnalytics({
        modelId: analyticsModelId,
        wired,
        mode: OsUpdateFlowMode.BOOTLOADER_REPAIR,
      }),
    [analyticsModelId, wired],
  );

  useEffect(() => {
    trackPage({ category: OsUpdatePage.BOOTLOADER_DETECTED, props: sharedAnalytics });
  }, [sharedAnalytics]);

  const onContinue = useCallback(() => {
    track("button_clicked", {
      button: OsUpdateButton.CONTINUE,
      page: OsUpdatePage.BOOTLOADER_DETECTED,
      ...sharedAnalytics,
    });
    openRepairFlow();
  }, [openRepairFlow, sharedAnalytics]);

  return { onContinue };
}
