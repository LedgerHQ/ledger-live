import React, { useCallback, useEffect, useState } from "react";
import { useAvailableLanguagesForDevice } from "@ledgerhq/live-common/manager/hooks";
import { useGetDeviceInfo } from "@ledgerhq/live-common/deviceSDK/hooks/useGetDeviceInfo";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Flex } from "@ledgerhq/native-ui";
import { DeviceModelId, getDeviceModel } from "@ledgerhq/devices";

import { track } from "~/analytics";
import { useLocale } from "~/context/Locale";
import { localeIdToDeviceLanguage } from "../../languages";
import { Language, idsToLanguage } from "@ledgerhq/types-live";
import QueuedDrawer from "~/components/QueuedDrawer";
import ChangeDeviceLanguageAction from "~/components/ChangeDeviceLanguageAction";
import ChangeDeviceLanguagePrompt from "~/components/ChangeDeviceLanguagePrompt";

export type LanguagePromptProps = {
  /**
   * A `Device` object
   */
  device: Device;
};

export const LanguagePrompt: React.FC<LanguagePromptProps> = ({ device }) => {
  const { deviceInfo } = useGetDeviceInfo({ deviceId: device.deviceId });
  const { availableLanguages, loaded: availableLanguagesLoaded } =
    useAvailableLanguagesForDevice(deviceInfo);

  const [isDeviceLanguagePromptOpen, setIsDeviceLanguagePromptOpen] = useState<boolean>(false);
  const [deviceLanguagePromptDismissed, setDeviceLanguagePromptDismissed] =
    useState<boolean>(false);
  const [preventPromptBackdropClick, setPreventPromptBackdropClick] = useState<boolean>(false);
  const [deviceForChangeLanguageAction, setDeviceForChangeLanguageAction] = useState<Device | null>(
    null,
  );

  const { locale: currentLocale } = useLocale();

  useEffect(() => {
    if (
      deviceInfo &&
      availableLanguages &&
      availableLanguagesLoaded &&
      !deviceLanguagePromptDismissed
    ) {
      const potentialDeviceLanguage = localeIdToDeviceLanguage[currentLocale];
      const deviceLanguageId = deviceInfo.languageId;
      const langAvailableOnDevice =
        potentialDeviceLanguage !== undefined &&
        availableLanguages.includes(potentialDeviceLanguage);

      if (
        langAvailableOnDevice &&
        deviceLanguageId !== undefined &&
        idsToLanguage[deviceLanguageId] !== potentialDeviceLanguage
      ) {
        setIsDeviceLanguagePromptOpen(true);
      }
    }
  }, [
    availableLanguages,
    availableLanguagesLoaded,
    deviceInfo,
    currentLocale,
    deviceLanguagePromptDismissed,
  ]);

  const closeDeviceLanguagePrompt = useCallback(() => {
    setIsDeviceLanguagePromptOpen(false);
    setDeviceLanguagePromptDismissed(true);
  }, []);

  return (
    <QueuedDrawer
      isRequestingToBeOpened={isDeviceLanguagePromptOpen}
      onClose={closeDeviceLanguagePrompt}
      preventBackdropClick={preventPromptBackdropClick}
    >
      <Flex alignItems="center">
        {deviceForChangeLanguageAction ? (
          <ChangeDeviceLanguageAction
            onError={() => {
              setPreventPromptBackdropClick(false);
            }}
            device={deviceForChangeLanguageAction}
            onStart={() => setPreventPromptBackdropClick(true)}
            language={localeIdToDeviceLanguage[currentLocale] as Language}
            onResult={() => setPreventPromptBackdropClick(false)}
            onContinue={() => {
              setDeviceForChangeLanguageAction(null);
              closeDeviceLanguagePrompt();
            }}
          />
        ) : (
          <ChangeDeviceLanguagePrompt
            language={localeIdToDeviceLanguage[currentLocale] as Language}
            deviceModel={getDeviceModel(device?.modelId || DeviceModelId.nanoX)}
            onConfirm={() => {
              track("Page LiveLanguageChange LanguageInstallTriggered", {
                selectedLanguage: localeIdToDeviceLanguage[currentLocale],
              });
              setDeviceForChangeLanguageAction(device);
            }}
          />
        )}
      </Flex>
    </QueuedDrawer>
  );
};
