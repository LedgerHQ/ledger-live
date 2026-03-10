import React, { useContext, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "LLD/hooks/redux";
import { useLocation, useNavigate } from "react-router";
import {
  Card,
  CardHeader,
  CardLeading,
  CardContent,
  CardContentTitle,
  CardContentDescription,
  CardTrailing,
  Button as NewButton,
} from "@ledgerhq/lumen-ui-react";
import { latestFirmwareSelector } from "~/renderer/reducers/settings";
import { UpdaterContext } from "~/renderer/components/Updater/UpdaterContext";
import { VISIBLE_STATUS } from "./Updater/Banner";
import StyleProvider from "~/renderer/styles/StyleProvider";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { track } from "~/renderer/analytics/segment";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import TopBanner from "./TopBanner";
import Box from "./Box";
import getCleanVersion from "../screens/manager/FirmwareUpdate/getCleanVersion";
import { useTheme } from "styled-components";
import { getEnv } from "@ledgerhq/live-env";
import { radii } from "~/renderer/styles/theme";
import { Button, Text } from "@ledgerhq/react-ui";
import { getDeviceIcon } from "LLD/utils/getDeviceIcon";

type BannerContentProps = {
  old?: boolean;
  right?: React.ReactNode;
  visibleFirmwareVersion: string;
  onClick: () => void;
};

const FirmwareUpdateBannerNew = ({
  old,
  right,
  visibleFirmwareVersion,
  onClick,
}: BannerContentProps) => {
  const { t } = useTranslation();

  return (
    <Card type="info" className="bg-accent" data-testid="fw-update-banner">
      <CardHeader>
        <CardLeading>
          <CardContent>
            <CardContentTitle>
              <span className="text-black">
                {t(
                  old
                    ? "manager.firmware.banner.old.warning"
                    : "manager.firmware.banner.wallet40.warning.manager",
                )}
              </span>
            </CardContentTitle>
            <CardContentDescription>
              <span className="text-black">
                {old
                  ? null
                  : t("manager.firmware.banner.version", {
                      latestFirmware: visibleFirmwareVersion,
                    })}
              </span>
            </CardContentDescription>
          </CardContent>
        </CardLeading>
        <CardTrailing>
          {right ?? (
            <NewButton appearance="base" size="sm" onClick={onClick}>
              {t("manager.firmware.banner.cta")}
            </NewButton>
          )}
        </CardTrailing>
      </CardHeader>
    </Card>
  );
};

const FirmwareUpdateBannerLegacy = ({
  old,
  right,
  visibleFirmwareVersion,
  onClick,
}: BannerContentProps) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <TopBanner
      id={"fw-update-banner"}
      testId="fw-update-banner"
      containerStyle={{
        background: `linear-gradient(to left, ${colors.primary.c70}, ${colors.primary.c60})`,
        borderRadius: radii[2],
        padding: "12px 16px",
      }}
      content={{
        message: (
          <Box>
            <Text fontFamily="Inter|Bold" fontSize={5} color="neutral.c100">
              {t(old ? "manager.firmware.banner.old.warning" : "manager.firmware.banner.warning")}
            </Text>
            {old ? null : (
              <Text color="neutral.c90">
                {t("manager.firmware.banner.version", {
                  latestFirmware: visibleFirmwareVersion,
                })}
              </Text>
            )}
          </Box>
        ),
        right: right ?? (
          <Button variant="main" onClick={onClick}>
            {t("manager.firmware.banner.cta")}
          </Button>
        ),
      }}
    />
  );
};

const FirmwareUpdateBanner = ({ old, right }: { old?: boolean; right?: React.ReactNode }) => {
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

  const onClick = () => {
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
  };

  const DeviceIcon = useMemo(() => getDeviceIcon(currentDevice?.modelId), [currentDevice]);

  if (shouldDisplayWallet40MainNav && !inManager) {
    return latestFirmware ? (
      <NewButton
        appearance="transparent"
        size="sm"
        icon={DeviceIcon}
        onClick={onClick}
        data-testid="topbar-os-update-button"
      >
        {t("manager.firmware.banner.wallet40.warning.default")}
      </NewButton>
    ) : null;
  }

  const visibleFirmwareVersion =
    process.env.DEBUG_FW_VERSION ??
    (latestFirmware ? getCleanVersion(latestFirmware.final.name) : "");

  // The 2.1.0-rc2 release caused issues with localization e2e tests because it
  // displayed a banner for updating the FW, which would continue to show with
  // future releases. To fix this, the banner is currently being manually removed.
  // A more stable solution would be to mock all API calls.
  const hideBannerForMocks = getEnv("MOCK") && visibleFirmwareVersion.startsWith("2.1");
  if (!visibleFirmwareVersion || (!right && inManager) || hideBannerForMocks) return null;

  const bannerProps = {
    old,
    right,
    visibleFirmwareVersion,
    onClick,
  };

  return shouldDisplayWallet40MainNav ? (
    <FirmwareUpdateBannerNew {...bannerProps} />
  ) : (
    <FirmwareUpdateBannerLegacy {...bannerProps} />
  );
};

const FirmwareUpdateBannerEntry = ({ old, right }: { old?: boolean; right?: React.ReactNode }) => {
  const context = useContext(UpdaterContext);
  if (context && context.version) {
    const { status } = context;
    if (VISIBLE_STATUS.includes(status)) return null;
  }

  return (
    <StyleProvider selectedPalette="dark">
      <FirmwareUpdateBanner old={old} right={right} />
    </StyleProvider>
  );
};

export default FirmwareUpdateBannerEntry;
