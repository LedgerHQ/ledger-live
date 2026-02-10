import React, { useContext } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "LLD/hooks/redux";
import { useLocation, useNavigate } from "react-router";
import { useTheme } from "styled-components";
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
  const navigate = useNavigate();
  const { t } = useTranslation();
  const location = useLocation();
  const latestFirmware = useSelector(latestFirmwareSelector);
  const visibleFirmwareVersion =
    process.env.DEBUG_FW_VERSION ??
    (latestFirmware ? getCleanVersion(latestFirmware.final.name) : "");
  const { colors } = useTheme();

  const onClick = () => {
    const urlParams = new URLSearchParams({
      firmwareUpdate: "true",
    });
    const search = urlParams.toString();
    navigate(`/manager?${search}`);
  };
  const inManager = location.pathname === "/manager";
  if (!visibleFirmwareVersion || (!right && inManager)) return null;
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
