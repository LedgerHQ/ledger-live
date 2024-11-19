import React, { useContext } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { useLocation, useHistory } from "react-router-dom";
import { useTheme } from "styled-components";
import { getEnv } from "@ledgerhq/live-env";
import { Button, Text } from "@ledgerhq/react-ui";
import { latestFirmwareSelector } from "~/renderer/reducers/settings";
import TopBanner from "~/renderer/components/TopBanner";
import getCleanVersion from "~/renderer/screens/manager/FirmwareUpdate/getCleanVersion";
import { UpdaterContext } from "~/renderer/components/Updater/UpdaterContext";
import { radii } from "~/renderer/styles/theme";
import { VISIBLE_STATUS } from "./Updater/Banner";
import Box from "./Box";
import StyleProvider from "../styles/StyleProvider";

const FirmwareUpdateBanner = ({ old, right }: { old?: boolean; right?: React.ReactNode }) => {
  const history = useHistory();
  const { t } = useTranslation();
  const location = useLocation();
  const latestFirmware = useSelector(latestFirmwareSelector);
  const visibleFirmwareVersion =
    process.env.DEBUG_FW_VERSION ??
    (latestFirmware ? getCleanVersion(latestFirmware.final.name) : "");
  const { colors } = useTheme();

  // The 2.1.0-rc2 release caused issues with localization e2e tests because it
  // displayed a banner for updating the FW, which would continue to show with
  // future releases. To fix this, the banner is currently being manually removed.
  // A more stable solution would be to mock all API calls.
  const hideBannerForMocks = getEnv("MOCK") && visibleFirmwareVersion.startsWith("2.1");

  const onClick = () => {
    const urlParams = new URLSearchParams({
      firmwareUpdate: "true",
    });
    const search = urlParams.toString();
    history.push({
      pathname: "/manager",
      search: `?${search}`,
    });
  };
  const inManager = location.pathname === "/manager";
  if (!visibleFirmwareVersion || (!right && inManager) || hideBannerForMocks) return null;
  // prevents the standard banner in Default.js from being displayed in the manager

  return (
    <TopBanner
      id={"fw-update-banner"}
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
        right: right || (
          <Button variant="main" onClick={onClick}>
            {t("manager.firmware.banner.cta")}
          </Button>
        ),
      }}
    />
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
