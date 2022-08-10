import React, { useState } from "react";
import { Button, Flex, Icons } from "@ledgerhq/react-ui";
import Text from "~/renderer/components/Text";
import DeviceLanguageInstallation from "./DeviceLanguageInstallation";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { idsToLanguage, Language, DeviceInfo } from "@ledgerhq/types-live";
import { useTranslation } from "react-i18next";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";

type Props = {
  // this makes sure that this component is only rendered if languageId is present in deviceInfo
  deviceInfo: DeviceInfo & { languageId: number };
  onRefreshDeviceInfo: () => void;
  device: Device;
};

const DeviceLanguage: React.FC<Props> = ({ deviceInfo, device, onRefreshDeviceInfo }: Props) => {
  const deviceLanguage = idsToLanguage[deviceInfo.languageId];
  const [isLanguageInstallationOpen, setIsLanguageInstallation] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(deviceLanguage);

  const { t } = useTranslation();

  return (
    <Flex alignItems="center">
      <Icons.LanguageMedium color="neutral.c80" size={24} />
      <Flex ml={1} mr={5}>
        <Text ff="Inter|SemiBold" color="palette.text.shade40" fontSize={4}>
          Language
        </Text>
      </Flex>
      <Button
        Icon={Icons.ChevronRightMedium}
        onClick={() => setIsLanguageInstallation(true)}
        data-test-id="manager-change-language-button"
      >
        {t(`deviceLocalization.languages.${deviceLanguage}`)}
      </Button>
      <DeviceLanguageInstallation
        isOpen={isLanguageInstallationOpen}
        onClose={() => setIsLanguageInstallation(false)}
        deviceInfo={deviceInfo}
        device={device}
        onError={onRefreshDeviceInfo}
        onSelectLanguage={setSelectedLanguage}
        selectedLanguage={selectedLanguage}
        currentLanguage={deviceLanguage}
        onSuccess={onRefreshDeviceInfo}
      />
    </Flex>
  );
};

export default withV3StyleProvider(DeviceLanguage);
