import React, { useCallback, useEffect, useState } from "react";
import { StepProps } from "../..";
import { idsToLanguage, Language as DeviceLanguages, languageIds } from "@ledgerhq/types-live";
import { Flex } from "@ledgerhq/react-ui";
import { useSelector } from "react-redux";
import { languageSelector } from "~/renderer/reducers/settings";
import { DEFAULT_LANGUAGE, Languages } from "~/config/languages";
import { useAvailableLanguagesForDevice } from "@ledgerhq/live-common/manager/hooks";
import { track } from "~/renderer/analytics/segment";
import ChangeDeviceLanguageAction from "~/renderer/components/ChangeDeviceLanguageAction";
import { renderLoading } from "~/renderer/components/DeviceAction/rendering";
import ChangeDeviceLanguagePrompt from "~/renderer/components/ChangeDeviceLanguagePrompt";
import { useTranslation } from "react-i18next";
import { DeviceModelId, getDeviceModel } from "@ledgerhq/devices";

type Props = Partial<StepProps> & { onDone: () => void; setError: (arg0: Error) => void };

const Language = ({
  updatedDeviceInfo,
  deviceInfo: oldDeviceInfo,
  deviceModelId,
  onDone,
  setError,
  setIsLanguagePromptOpen,
  isLanguagePromptOpen,
  confirmedPrompt,
}: Props) => {
  const [languageToInstall, setLanguageToInstall] = useState<DeviceLanguages>(
    DEFAULT_LANGUAGE.deviceSupport.label,
  );

  const [installingLanguage, setInstallingLanguage] = useState(false);
  const { t } = useTranslation();

  const currentLocale = useSelector(languageSelector);

  const { availableLanguages: newAvailableLanguages, loaded: newLanguagesLoaded } =
    useAvailableLanguagesForDevice(updatedDeviceInfo);

  const { availableLanguages: oldAvailableLanguages, loaded: oldLanguagesLoaded } =
    useAvailableLanguagesForDevice(oldDeviceInfo);

  const installLanguage = useCallback((language: DeviceLanguages) => {
    setLanguageToInstall(language);
    setInstallingLanguage(true);
  }, []);

  useEffect(() => {
    if (newLanguagesLoaded && oldLanguagesLoaded) {
      const deviceLanguageId = updatedDeviceInfo?.languageId;
      const potentialDeviceLanguage = Languages[currentLocale];

      const langAvailableForTheFirstTime =
        potentialDeviceLanguage.deviceSupport &&
        !oldAvailableLanguages.includes(potentialDeviceLanguage.deviceSupport.label) &&
        newAvailableLanguages.includes(potentialDeviceLanguage.deviceSupport.label);

      // firmware version verification is not really needed here, the presence of a language id
      // indicates that we are in a firmware that supports localization
      if (
        !confirmedPrompt &&
        langAvailableForTheFirstTime &&
        deviceLanguageId !== undefined &&
        potentialDeviceLanguage.deviceSupport &&
        idsToLanguage[deviceLanguageId] !== potentialDeviceLanguage.deviceSupport.label &&
        setIsLanguagePromptOpen
      ) {
        setIsLanguagePromptOpen(true);
      } else if (
        potentialDeviceLanguage.deviceSupport &&
        confirmedPrompt &&
        setIsLanguagePromptOpen
      ) {
        track("Page Manager FwUpdatePromptLanguageToMatchLive");
        setIsLanguagePromptOpen(false);
        installLanguage(potentialDeviceLanguage.deviceSupport.label);
      } else if (
        oldDeviceInfo?.languageId !== undefined &&
        oldDeviceInfo?.languageId !== languageIds.english
      ) {
        track("Page Manager FwUpdateReinstallLanguage");
        installLanguage(idsToLanguage[oldDeviceInfo.languageId]);
      } else {
        onDone();
      }
    }
  }, [
    newAvailableLanguages,
    newLanguagesLoaded,
    oldAvailableLanguages,
    oldLanguagesLoaded,
    currentLocale,
    oldDeviceInfo,
    updatedDeviceInfo,
    installLanguage,
    confirmedPrompt,
    onDone,
    setIsLanguagePromptOpen,
  ]);

  const modelId = deviceModelId || DeviceModelId.nanoX;
  const deviceName = getDeviceModel(modelId).productName;

  return (
    <Flex justifyContent="center" flex={1}>
      {isLanguagePromptOpen && !confirmedPrompt ? (
        <ChangeDeviceLanguagePrompt
          descriptionWording={t("deviceLocalization.firmwareUpdatePrompt.description", {
            language: t(
              `deviceLocalization.languages.${Languages[currentLocale].deviceSupport?.label}`,
            ),
            deviceName,
          })}
          deviceModelId={modelId}
          showActions={false}
        />
      ) : installingLanguage ? (
        <ChangeDeviceLanguageAction
          language={languageToInstall}
          onError={setError}
          onSuccess={() => {
            track("Page Manager FwUpdateLanguageInstalled", {
              selectedLanguage: languageToInstall,
            });
            setInstallingLanguage(false);
            onDone();
          }}
        />
      ) : (
        !isLanguagePromptOpen && renderLoading({})
      )}
    </Flex>
  );
};

export default Language;
