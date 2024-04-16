import { Icons, Text } from "@ledgerhq/native-ui";
import React, { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Language, DeviceInfo } from "@ledgerhq/types-live";
import { useAvailableLanguagesForDevice } from "@ledgerhq/live-common/manager/hooks";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import DeviceLanguageSelection from "./DeviceLanguageSelection";
import QueuedDrawer from "~/components/QueuedDrawer";
import ChangeDeviceLanguageActionModal from "~/components/ChangeDeviceLanguageActionModal";
import { track } from "~/analytics";
import DeviceOptionRow from "./DeviceOptionRow";

type Props = {
  disabled: boolean;
  currentDeviceLanguage: Language;
  device: Device;
  deviceInfo: DeviceInfo;
  onLanguageChange: () => void;
};

const DeviceLanguage: React.FC<Props> = ({
  disabled,
  currentDeviceLanguage,
  device,
  deviceInfo,
  onLanguageChange,
}) => {
  const { t } = useTranslation();

  const [isChangeLanguageOpen, setIsChangeLanguageOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(currentDeviceLanguage);

  const { availableLanguages } = useAvailableLanguagesForDevice(deviceInfo);

  const [shouldInstallLanguage, setShouldInstallLanguage] = useState<boolean>(false);
  const [deviceForActionModal, setDeviceForActionModal] = useState<Device | null>(null);

  const closeChangeLanguageModal = useCallback(
    () => setIsChangeLanguageOpen(false),
    [setIsChangeLanguageOpen],
  );
  const openChangeLanguageModal = useCallback(() => {
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
    onLanguageChange();
  }, [onLanguageChange]);

  const errorTracked = useRef<Error | null>(null);
  const handleError = useCallback(
    (error: Error) => {
      if (errorTracked.current !== error) {
        track("Page Manager LanguageInstallError", { error, type: "drawer" });
        errorTracked.current = error;
      }
      refreshDeviceLanguage();
    },
    [refreshDeviceLanguage],
  );
  const handleResult = useCallback(() => {
    track("Page Manager LanguageInstalled", {
      selectedLanguage,
      type: "drawer",
    });
    refreshDeviceLanguage();
  }, [refreshDeviceLanguage, selectedLanguage]);

  return (
    <>
      <DeviceOptionRow
        Icon={Icons.Language}
        label={t("deviceLocalization.language")}
        onPress={disabled ? undefined : openChangeLanguageModal}
        linkLabel={t(`deviceLocalization.languages.${currentDeviceLanguage}`)}
        right={
          availableLanguages.length ? undefined : (
            <Text>{t(`deviceLocalization.languages.${currentDeviceLanguage}`)}</Text>
          )
        }
      />
      <QueuedDrawer
        isRequestingToBeOpened={isChangeLanguageOpen}
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
      </QueuedDrawer>
      <ChangeDeviceLanguageActionModal
        onClose={closeDeviceActionModal}
        device={deviceForActionModal}
        language={selectedLanguage}
        onError={handleError}
        onResult={handleResult}
      />
    </>
  );
};

export default DeviceLanguage;
