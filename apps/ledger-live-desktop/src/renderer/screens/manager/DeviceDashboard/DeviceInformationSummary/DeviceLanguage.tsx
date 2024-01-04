import React, { useCallback } from "react";
import { Flex, IconsLegacy, Link, Text } from "@ledgerhq/react-ui";
import DeviceLanguageInstallation from "./DeviceLanguageInstallation";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { idsToLanguage, Language, DeviceInfo } from "@ledgerhq/types-live";
import { track } from "~/renderer/analytics/segment";
import { useTranslation } from "react-i18next";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import { setDrawer } from "~/renderer/drawers/Provider";
import ToolTip from "~/renderer/components/Tooltip";

type Props = {
  // this makes sure that this component is only rendered if languageId is present in deviceInfo
  deviceInfo: DeviceInfo & { languageId: number };
  onRefreshDeviceInfo: () => void;
  device: Device;
  disabled?: boolean;
};

const DeviceLanguage: React.FC<Props> = ({
  deviceInfo,
  device,
  onRefreshDeviceInfo,
  disabled,
}: Props) => {
  const deviceLanguage = idsToLanguage[deviceInfo.languageId];

  const openLanguageInstallation = useCallback(() => {
    setDrawer(DeviceLanguageInstallation, {
      deviceInfo,
      device,
      onError: (error: Error) => {
        track("Page Manager LanguageInstallError", { error });
        onRefreshDeviceInfo();
      },
      currentLanguage: deviceLanguage,
      onSuccess: (selectedLanguage: Language) => {
        track("Page Manager LanguageInstalled", { selectedLanguage });
        onRefreshDeviceInfo();
      },
    });

    track("Page Manager ChangeLanguageEntered");
  }, [device, deviceInfo, deviceLanguage, onRefreshDeviceInfo]);

  const { t } = useTranslation();

  return (
    <Flex alignItems="center">
      <Flex ml={1} mr={5}>
        <Text variant="h5Inter" fontSize={4} color="neutral.c70">
          {t("deviceLocalization.language")}
        </Text>
      </Flex>
      <Link
        type="main"
        disabled={disabled}
        Icon={
          disabled
            ? props => (
                <ToolTip
                  content={
                    <Text color="neutral.c00" variant="small">
                      {t("appsInstallingDisabledTooltip")}
                    </Text>
                  }
                  placement="top"
                >
                  <IconsLegacy.InfoAltFillMedium {...props} />
                </ToolTip>
              )
            : IconsLegacy.ChevronRightMedium
        }
        onClick={disabled ? undefined : openLanguageInstallation}
        data-test-id="manager-change-language-button"
      >
        {t(`deviceLocalization.languages.${deviceLanguage}`)}
      </Link>
    </Flex>
  );
};

export default withV3StyleProvider(DeviceLanguage);
