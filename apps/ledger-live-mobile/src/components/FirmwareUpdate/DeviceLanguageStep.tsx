import React, { useCallback, useEffect, useState } from "react";

import { useTranslation } from "react-i18next";

import { Flex } from "@ledgerhq/native-ui";
import { getDeviceModel } from "@ledgerhq/devices";
import {
  DeviceInfo,
  idsToLanguage,
  Language,
  languageIds,
} from "@ledgerhq/types-live";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useAvailableLanguagesForDevice } from "@ledgerhq/live-common/lib/manager/hooks";

import Track from "../../analytics/Track";
import { FwUpdateForegroundEvent } from ".";
import { useLocale } from "../../context/Locale";
import { localeIdToDeviceLanguage } from "../../languages";

import ChangeDeviceLanguageAction from "../ChangeDeviceLanguageAction";
import ChangeDeviceLanguagePrompt from "../ChangeDeviceLanguagePrompt";
import DeviceActionProgress from "../DeviceActionProgress";

type Props = {
  oldDeviceInfo?: DeviceInfo;
  updatedDeviceInfo?: DeviceInfo;
  device: Device;
  dispatchEvent: React.Dispatch<FwUpdateForegroundEvent>;
};
const DeviceLanguageStep = ({
  oldDeviceInfo,
  updatedDeviceInfo,
  dispatchEvent,
  device,
}: Props) => {
  const { locale: currentLocale } = useLocale();

  let {
    availableLanguages: newAvailableLanguages,
    loaded: newLanguagesLoaded,
  } = useAvailableLanguagesForDevice(updatedDeviceInfo);
  let {
    availableLanguages: oldAvailableLanguages,
    loaded: oldLanguagesLoaded,
  } = useAvailableLanguagesForDevice(oldDeviceInfo);

  const [isLanguagePromptOpen, setIsLanguagePromptOpen] = useState<boolean>(
    false,
  );

  const [languageToInstall, setLanguageToInstall] = useState<Language>(
    "english",
  );
  const [deviceForAction, setDeviceForAction] = useState<Device | null>(null);

  const { t } = useTranslation();

  const deviceLocalizationFeatureFlag = { enabled: true }; // useFeature("deviceLocalization");

  const installLanguage = useCallback(
    (language: Language) => {
      setLanguageToInstall(language);
      setDeviceForAction(device);
    },
    [device],
  );

  useEffect(() => {
    if (newLanguagesLoaded && oldLanguagesLoaded) {
      const deviceLanguageId = updatedDeviceInfo?.languageId;
      const potentialDeviceLanguage = localeIdToDeviceLanguage[currentLocale];

      const langAvailableForTheFirstTime =
        potentialDeviceLanguage !== undefined &&
        !oldAvailableLanguages.includes(potentialDeviceLanguage) &&
        newAvailableLanguages.includes(potentialDeviceLanguage);

      // firmware version verification is not really needed here, the presence of a language id
      // indicates that we are in a firmware that supports localization
      if (
        langAvailableForTheFirstTime &&
        deviceLanguageId !== undefined &&
        idsToLanguage[deviceLanguageId] !== potentialDeviceLanguage &&
        deviceLocalizationFeatureFlag.enabled
      ) {
        setIsLanguagePromptOpen(true);
      } else if (
        oldDeviceInfo?.languageId !== undefined &&
        oldDeviceInfo?.languageId !== languageIds["english"]
      ) {
        installLanguage(idsToLanguage[oldDeviceInfo.languageId]);
      } else {
        dispatchEvent({ type: "languagePromptDismissed" });
      }
    }
  }, [
    newAvailableLanguages,
    newLanguagesLoaded,
    oldAvailableLanguages,
    oldLanguagesLoaded,
    dispatchEvent,
    currentLocale,
    oldDeviceInfo,
    updatedDeviceInfo,
    installLanguage,
  ]);


  const deviceName = getDeviceModel(device.modelId).productName;

  return (
    <Flex alignItems="center">
      {isLanguagePromptOpen && deviceForAction === null && (
        <>
          <Track event="FirmwareUpdateFirstDeviceLanguagePrompt" onMount />
          <ChangeDeviceLanguagePrompt
            titleWording={t("deviceLocalization.firmwareUpdatePrompt.title", {
              language: t(
                `deviceLocalization.languages.${localeIdToDeviceLanguage[currentLocale]}`,
              ),
              deviceName,
            })}
            descriptionWording={t(
              "deviceLocalization.firmwareUpdatePrompt.description",
              {
                language: t(
                  `deviceLocalization.languages.${localeIdToDeviceLanguage[currentLocale]}`,
                ),
                deviceName,
              },
            )}
            canSkip
            onSkip={() => dispatchEvent({ type: "languagePromptDismissed" })}
            onConfirm={() =>
              installLanguage(
                localeIdToDeviceLanguage[currentLocale] as Language,
              )
            }
          />
        </>
      )}
      {deviceForAction !== null ? (
        <ChangeDeviceLanguageAction
          device={deviceForAction}
          language={languageToInstall}
          onContinue={() => {
            setDeviceForAction(null);
            dispatchEvent({ type: "languagePromptDismissed" });
          }}
        />
      ) : (
        !isLanguagePromptOpen && <DeviceActionProgress />
      )}
    </Flex>
  );
};

export default DeviceLanguageStep;
