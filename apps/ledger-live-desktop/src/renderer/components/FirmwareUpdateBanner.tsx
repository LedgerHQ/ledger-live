import React, { useContext, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "LLD/hooks/redux";
import { useLocation, useNavigate } from "react-router";
import { Button as NewButton } from "@ledgerhq/lumen-ui-react";
import { latestFirmwareSelector } from "~/renderer/reducers/settings";
import { UpdaterContext } from "~/renderer/components/Updater/UpdaterContext";
import { VISIBLE_STATUS } from "./Updater/Banner";
import StyleProvider from "~/renderer/styles/StyleProvider";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { Apex, Flex, Nano, Stax } from "@ledgerhq/lumen-ui-react/symbols";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { track } from "~/renderer/analytics/segment";
import { FirmwareUpdateContext } from "@ledgerhq/types-live";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import TopBanner from "./TopBanner";
import Box from "./Box";
import getCleanVersion from "../screens/manager/FirmwareUpdate/getCleanVersion";
import { useTheme } from "styled-components";
import { getEnv } from "@ledgerhq/live-env";
import { radii } from "~/renderer/styles/theme";
import { Button, Text } from "@ledgerhq/react-ui";
import { osUpdateRequested } from "../reducers/manager";

function getDeviceIcon(modelId: DeviceModelId | undefined) {
  switch (modelId) {
    case DeviceModelId.stax:
      return Stax;
    case DeviceModelId.europa:
      return Flex;
    case DeviceModelId.apex:
      return Apex;
    default:
      return Nano;
  }
}

const FirmwareUpdateBanner = ({ old, right }: { old?: boolean; right?: React.ReactNode }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const latestFirmware = useSelector(latestFirmwareSelector);
  const currentDevice = useSelector(getCurrentDevice);
  const { isEnabled: isWallet40Enabled } = useWalletFeaturesConfig("desktop");
  const { colors } = useTheme();

  const onClick = (latestFirmware: FirmwareUpdateContext) => {
    if (isWallet40Enabled) {
      track("Manager Firmware Update Click", {
        firmwareName: latestFirmware.final.name,
      });
      dispatch(osUpdateRequested(true));
      navigate("/manager");
    } else {
      const urlParams = new URLSearchParams({
        firmwareUpdate: "true",
      });
      const search = urlParams.toString();
      navigate(`/manager?${search}`);
    }
  };

  const DeviceIcon = useMemo(() => getDeviceIcon(currentDevice?.modelId), [currentDevice]);

  if (isWallet40Enabled) {
    return latestFirmware ? (
      <NewButton
        appearance="transparent"
        size="sm"
        icon={DeviceIcon}
        onClick={() => onClick(latestFirmware)}
        data-testid="topbar-os-update-button"
      >
        {t("manager.firmware.banner.warning")}
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
  const inManager = location.pathname === "/manager";
  if (!visibleFirmwareVersion || (!right && inManager) || hideBannerForMocks) return null;

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
          <Button variant="main" onClick={() => onClick(latestFirmware!)}>
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
