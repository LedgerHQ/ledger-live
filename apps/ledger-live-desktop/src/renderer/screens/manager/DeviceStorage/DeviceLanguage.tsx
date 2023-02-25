import React, { useCallback } from "react";
import { Flex, Icons, Link, Text } from "@ledgerhq/react-ui";
import DeviceLanguageInstallation from "./DeviceLanguageInstallation";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { idsToLanguage, Language, DeviceInfo } from "@ledgerhq/types-live";
import { track } from "~/renderer/analytics/segment";
import { useTranslation } from "react-i18next";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import { setDrawer } from "~/renderer/drawers/Provider";

type Props = {
  // this makes sure that this component is only rendered if languageId is present in deviceInfo
  deviceInfo: DeviceInfo & { languageId: number };
  onRefreshDeviceInfo: () => void;
  device: Device;
};

const DeviceLanguage: React.FC<Props> = ({ deviceInfo, device, onRefreshDeviceInfo }: Props) => {
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
      <Icons.LanguageMedium color="neutral.c80" size={24} />
      <Flex ml={1} mr={5}>
        <Text color="neutral.c80" variant="bodyLineHeight" fontSize={4}>
          {t("deviceLocalization.language")}
        </Text>
      </Flex>
      <Link
        type="main"
        Icon={Icons.ChevronRightMedium}
        onClick={openLanguageInstallation}
        data-test-id="manager-change-language-button"
      >
        {t(`deviceLocalization.languages.${deviceLanguage}`)}
      </Link>
    </Flex>
  );
};

export default withV3StyleProvider(DeviceLanguage);
