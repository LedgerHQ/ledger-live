import React, { useEffect, useState } from "react";

import { useTranslation } from "react-i18next";

import { Flex } from "@ledgerhq/native-ui";
import { getDeviceModel } from "@ledgerhq/devices";
import { DeviceInfo } from "@ledgerhq/live-common/lib/types/manager";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useAvailableLanguagesForDevice } from "@ledgerhq/live-common/lib/manager/hooks";
import {
  idsToLanguage,
  Language,
} from "@ledgerhq/live-common/lib/types/languages";

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
const PropmtDeviceLanguageStep = ({
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
  const [isDeviceLanguagePromptOpen, setIsDeviceLanguagePromptOpen] = useState<
    boolean
  >(false);
  const [
    deviceForChangeLanguageAction,
    setDeviceForChangeLanguageAction,
  ] = useState<Device | null>(null);

  const { t } = useTranslation();

  const deviceLocalizationFeatureFlag = { enabled: true }; // useFeature("deviceLocalization");

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
        setIsDeviceLanguagePromptOpen(true);
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
    updatedDeviceInfo,
  ]);

  const deviceName = getDeviceModel(device.modelId).productName;

  return (
    <Flex alignItems="center">
      {isDeviceLanguagePromptOpen ? (
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
            onConfirm={() => setDeviceForChangeLanguageAction(device)}
          />
          <ChangeDeviceLanguageAction
            device={deviceForChangeLanguageAction}
            language={localeIdToDeviceLanguage[currentLocale] as Language}
            onClose={() => {
              setDeviceForChangeLanguageAction(null);
              dispatchEvent({ type: "languagePromptDismissed" });
            }}
          />
        </>
      ) : (
        <DeviceActionProgress />
      )}
    </Flex>
  );
};

export default PropmtDeviceLanguageStep;
