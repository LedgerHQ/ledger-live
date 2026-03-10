import { useCallback, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "LLD/hooks/redux";
import { useLocation, useNavigate } from "react-router";
import { latestFirmwareSelector } from "~/renderer/reducers/settings";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { track } from "~/renderer/analytics/segment";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import getCleanVersion from "~/renderer/screens/manager/FirmwareUpdate/getCleanVersion";
import { getEnv } from "@ledgerhq/live-env";
import { DeviceIconComponent, getDeviceIcon } from "LLD/utils/getDeviceIcon";

export type FirmwareUpdateBannerViewModelResult =
  | { kind: "hidden" }
  | {
      kind: "topbar-button";
      deviceIcon: DeviceIconComponent;
      onClick: () => void;
      buttonLabel: string;
    }
  | {
      kind: "full-banner";
      useWallet40Style: boolean;
      old: boolean | undefined;
      right: React.ReactNode | undefined;
      visibleFirmwareVersion: string;
      onClick: () => void;
    };

export function useFirmwareUpdateBannerViewModel(props: {
  old?: boolean;
  right?: React.ReactNode;
}): FirmwareUpdateBannerViewModelResult {
  const { old, right } = props;
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const latestFirmware = useSelector(latestFirmwareSelector);
  const currentDevice = useSelector(getCurrentDevice);
  const { shouldDisplayWallet40MainNav } = useWalletFeaturesConfig("desktop");
  const hasTrackedImpressionRef = useRef(false);
  const isOnDashboard = location.pathname === "/";
  const inManager = location.pathname === "/manager";

  useEffect(() => {
    if (
      !hasTrackedImpressionRef.current &&
      shouldDisplayWallet40MainNav &&
      (isOnDashboard || inManager)
    ) {
      hasTrackedImpressionRef.current = true;
      track("banner_impression", {
        banner: "OS update",
        page: inManager ? "my ledger" : "portfolio",
      });
    }
  }, [shouldDisplayWallet40MainNav, isOnDashboard, inManager]);

  const onClick = useCallback(() => {
    if (shouldDisplayWallet40MainNav) {
      track("button_clicked", {
        page: "portfolio",
        banner: "OS update",
        button: "click(update)",
      });
    }
    const urlParams = new URLSearchParams({
      firmwareUpdate: "true",
    });
    const search = urlParams.toString();
    navigate(`/manager?${search}`);
  }, [navigate, shouldDisplayWallet40MainNav]);

  const deviceIcon = useMemo(() => getDeviceIcon(currentDevice?.modelId), [currentDevice?.modelId]);

  const visibleFirmwareVersion =
    process.env.DEBUG_FW_VERSION ??
    (latestFirmware ? getCleanVersion(latestFirmware.final.name) : "");

  const hideBannerForMocks = getEnv("MOCK") && visibleFirmwareVersion.startsWith("2.1");

  if (shouldDisplayWallet40MainNav && !inManager) {
    if (!latestFirmware) return { kind: "hidden" };
    return {
      kind: "topbar-button",
      deviceIcon,
      onClick,
      buttonLabel: t("manager.firmware.banner.wallet40.warning.default"),
    };
  }

  if (!visibleFirmwareVersion || (!right && inManager) || hideBannerForMocks) {
    return { kind: "hidden" };
  }

  return {
    kind: "full-banner",
    useWallet40Style: shouldDisplayWallet40MainNav,
    old,
    right,
    visibleFirmwareVersion,
    onClick,
  };
}
