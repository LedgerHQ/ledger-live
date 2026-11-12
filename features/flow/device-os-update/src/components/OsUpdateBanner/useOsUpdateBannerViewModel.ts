import { useCallback, useEffect, useRef, type ComponentType } from "react";
import { useSelector } from "react-redux";
import { track } from "@shared/analytics";
import { selectOsUpdates } from "@domain/entity-device-os-update";

export type OsUpdateBannerPlacement = "portfolio" | "myLedger";
export type OsUpdateBannerVariant = "hidden" | OsUpdateBannerPlacement;

export type OsUpdateBannerProps = Readonly<{
  placement: OsUpdateBannerPlacement;
  hasCompletedOnboarding: boolean;
  hasConnectedDevice: boolean;
  /** The Ledger Wallet model id of the last connected or seen device, sent in analytics. */
  analyticsModelId: string | undefined;
  DeviceIcon: ComponentType;
  onUpdate: () => void;
}>;

const ANALYTICS_PAGE: Record<OsUpdateBannerPlacement, string> = {
  portfolio: "portfolio",
  myLedger: "my ledger",
};

export function useOsUpdateBannerViewModel({
  placement,
  hasCompletedOnboarding,
  hasConnectedDevice,
  analyticsModelId,
  DeviceIcon,
  onUpdate,
}: OsUpdateBannerProps) {
  const latestOsUpdate = useSelector(selectOsUpdates).at(-1);
  const isVisible = Boolean(latestOsUpdate) && hasCompletedOnboarding && hasConnectedDevice;
  const variant: OsUpdateBannerVariant = isVisible ? placement : "hidden";
  const page = ANALYTICS_PAGE[placement];

  const impressionTracked = useRef(false);
  useEffect(() => {
    if (impressionTracked.current) return;
    impressionTracked.current = true;
    track("banner_impression", { banner: "OS update", page, modelId: analyticsModelId });
  }, [page, analyticsModelId]);

  const onClickUpdate = useCallback(() => {
    track("button_clicked", {
      page,
      banner: "OS update",
      button: "click(update)",
      modelId: analyticsModelId,
    });
    onUpdate();
  }, [page, analyticsModelId, onUpdate]);

  return {
    variant,
    version: latestOsUpdate?.finalFirmware.version ?? "",
    DeviceIcon,
    onClickUpdate,
  };
}

export type OsUpdateBannerViewProps = ReturnType<typeof useOsUpdateBannerViewModel>;
