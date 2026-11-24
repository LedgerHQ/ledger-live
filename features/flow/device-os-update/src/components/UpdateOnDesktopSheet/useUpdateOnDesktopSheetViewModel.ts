import { useCallback, useEffect, useMemo } from "react";
import { track, trackPage } from "@shared/analytics";
import { getSharedAnalytics } from "../../analytics/getSharedAnalytics";
import { OsUpdateButton, OsUpdatePage } from "../../analytics/analyticsTypes";

export type UpdateOnDesktopSheetProps = Readonly<{
  isOpen: boolean;
  /** Where the update banner the user tapped is, sent in analytics. */
  page: string;
  /** The product name of the device model. */
  productName: string;
  /** The Ledger Wallet model id sent in analytics. */
  analyticsModelId: string;
  wired: boolean;
  /** The OS version the device runs. */
  osVersionFrom?: string;
  /** The OS version the update would install. */
  osVersionTo?: string;
  onClose: () => void;
}>;

export function useUpdateOnDesktopSheetViewModel({
  isOpen,
  page,
  analyticsModelId,
  wired,
  osVersionFrom,
  osVersionTo,
  onClose,
}: UpdateOnDesktopSheetProps) {
  const sharedAnalytics = useMemo(
    () => ({
      ...getSharedAnalytics({ modelId: analyticsModelId, wired }),
      entryPage: page,
      ...(osVersionFrom === undefined ? {} : { osVersionFrom }),
      ...(osVersionTo === undefined ? {} : { osVersionTo }),
    }),
    [analyticsModelId, wired, page, osVersionFrom, osVersionTo],
  );

  useEffect(() => {
    if (!isOpen) return;
    trackPage({ category: OsUpdatePage.UPDATE_ON_DESKTOP, props: sharedAnalytics });
  }, [isOpen, sharedAnalytics]);

  const onGotIt = useCallback(() => {
    track("button_clicked", {
      button: OsUpdateButton.GOT_IT,
      page: OsUpdatePage.UPDATE_ON_DESKTOP,
      ...sharedAnalytics,
    });
    onClose();
  }, [onClose, sharedAnalytics]);

  return { onGotIt };
}
