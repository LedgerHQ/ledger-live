import { Flex, Icons, Link, Text } from "@ledgerhq/native-ui";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Language, DeviceInfo } from "@ledgerhq/types-live";
import { useAvailableLanguagesForDevice } from "@ledgerhq/live-common/manager/hooks";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import BottomModal from "../../../components/BottomModal";
import DeviceLanguageSelection from "./DeviceLanguageSelection";
import ChangeDeviceLanguageActionModal from "../../../components/ChangeDeviceLanguageActionModal";
import { track } from "../../../analytics";

type Props = {
  pendingInstalls: boolean;
  currentDeviceLanguage: Language;
  device: Device;
  deviceInfo: DeviceInfo;
  onLanguageChange: () => void;
};

const DeviceLanguage: React.FC<Props> = ({
  pendingInstalls,
  currentDeviceLanguage,
  device,
  deviceInfo,
  onLanguageChange,
}) => {
  const { t } = useTranslation();

  const [isChangeLanguageOpen, setIsChangeLanguageOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(
    currentDeviceLanguage,
  );

  const { availableLanguages } = useAvailableLanguagesForDevice(deviceInfo);

  const [shouldInstallLanguage, setShouldInstallLanguage] =
    useState<boolean>(false);
  const [deviceForActionModal, setDeviceForActionModal] =
    useState<Device | null>(null);

  const closeChangeLanguageModal = useCallback(
    () => setIsChangeLanguageOpen(false),
    [setIsChangeLanguageOpen],
  );
  const openChangeLanguageModal = useCallback(() => {
    track("Page Manager ChangeLanguageEntered");
    setIsChangeLanguageOpen(true);
  }, [setIsChangeLanguageOpen]);

  const confirmInstall = useCallback(() => {
    track("Page Manager LanguageInstallTriggered", { selectedLanguage });
    setShouldInstallLanguage(true);
    closeChangeLanguageModal();
  }, [setShouldInstallLanguage, closeChangeLanguageModal, selectedLanguage]);
  // this has to be done in two steps because we can only open the second modal after the first
  // one has been hidden. So we need to put this function attached to the onModalHide prop of the first
  // see https://github.com/react-native-modal/react-native-modal/issues/30
  const openDeviceActionModal = useCallback(() => {
    if (shouldInstallLanguage) {
      setDeviceForActionModal(device);
    }
  }, [shouldInstallLanguage, device, setDeviceForActionModal]);

  const closeDeviceActionModal = useCallback(() => {
    setShouldInstallLanguage(false);
    setDeviceForActionModal(null);
  }, [setShouldInstallLanguage, setDeviceForActionModal]);

  const refreshDeviceLanguage = useCallback(() => {
    track("Page Manager LanguageInstalled", { selectedLanguage });
    onLanguageChange();
  }, [selectedLanguage]);

  return (
    <>
      <Flex flex={1} flexDirection="row" alignItems="center">
        <Icons.LanguageMedium size={24} color="neutral.c80" />
        <Text ml={3} flex={1} variant="bodyLineHeight" color="neutral.c80">
          {t("deviceLocalization.language")}
        </Text>
        {availableLanguages.length ? (
          <Link
            onPress={pendingInstalls ? undefined : openChangeLanguageModal}
            type="color"
            Icon={Icons.ChevronRightMedium}
          >
            {t(`deviceLocalization.languages.${currentDeviceLanguage}`)}
          </Link>
        ) : (
          <Text>
            {t(`deviceLocalization.languages.${currentDeviceLanguage}`)}
          </Text>
        )}
      </Flex>
      <BottomModal
        isOpened={isChangeLanguageOpen}
        onClose={closeChangeLanguageModal}
        onModalHide={openDeviceActionModal}
      >
        <DeviceLanguageSelection
          device={device}
          deviceLanguage={currentDeviceLanguage}
          onSelectLanguage={setSelectedLanguage}
          selectedLanguage={selectedLanguage}
          onConfirmInstall={confirmInstall}
          availableLanguages={availableLanguages}
        />
      </BottomModal>
      <ChangeDeviceLanguageActionModal
        onClose={closeDeviceActionModal}
        device={deviceForActionModal}
        language={selectedLanguage}
        onError={error => {
          track("Page Manager LanguageInstallError", { error });
          refreshDeviceLanguage();
        }}
        onResult={refreshDeviceLanguage}
      />
    </>
  );
};

export default DeviceLanguage;
