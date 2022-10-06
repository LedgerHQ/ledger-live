import React, { useState, useCallback } from "react";
import { Flex, Icons, Link } from "@ledgerhq/react-ui";
import Text from "~/renderer/components/Text";
import DeviceLanguageInstallation from "./DeviceLanguageInstallation";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { idsToLanguage, Language, DeviceInfo } from "@ledgerhq/types-live";
import { useTranslation } from "react-i18next";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";

type Props = {
  // this makes sure that this component is only rendered if languageId is present in deviceInfo
  deviceInfo: DeviceInfo & { languageId: number };
  device: Device;
};

const DeviceLanguage: React.FC<Props> = ({ deviceInfo, device }: Props) => {
  const [isLanguageInstallationOpen, setIsLanguageInstallation] = useState(false);
  const [deviceLanguage, setDeviceLanguage] = useState<Language>(
    idsToLanguage[deviceInfo.languageId],
  );
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(deviceLanguage);

  const refreshDeviceLanguage = useCallback(() => {
    setDeviceLanguage(selectedLanguage);
  }, [setDeviceLanguage, selectedLanguage]);

  const { t } = useTranslation();

  return (
    <Flex alignItems="center">
      <Icons.LanguageMedium color="neutral.c80" size={24} />
      <Flex ml={1} mr={5}>
        <Text ff="Inter|SemiBold" color="palette.text.shade40" fontSize={4}>
          {t("deviceLocalization.language")}
        </Text>
      </Flex>
      <Link
        type="main"
        Icon={Icons.ChevronRightMedium}
        onClick={() => setIsLanguageInstallation(true)}
        data-test-id="manager-change-language-button"
      >
        {t(`deviceLocalization.languages.${deviceLanguage}`)}
      </Link>
      <DeviceLanguageInstallation
        isOpen={isLanguageInstallationOpen}
        onClose={() => setIsLanguageInstallation(false)}
        deviceInfo={deviceInfo}
        device={device}
        onSelectLanguage={setSelectedLanguage}
        selectedLanguage={selectedLanguage}
        currentLanguage={deviceLanguage}
        onSuccess={refreshDeviceLanguage}
      />
    </Flex>
  );
};

export default withV3StyleProvider(DeviceLanguage);
