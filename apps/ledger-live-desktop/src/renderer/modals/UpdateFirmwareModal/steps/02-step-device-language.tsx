import React, { useCallback, useEffect, useState } from "react";
import { getDeviceModel } from "@ledgerhq/devices";
import { StepProps } from "..";
import { idsToLanguage, Language, languageIds } from "@ledgerhq/types-live";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { Flex } from "@ledgerhq/react-ui";
import { useSelector } from "react-redux";
import { languageSelector } from "~/renderer/reducers/settings";
import { Locale, localeIdToDeviceLanguage } from "~/config/languages";
import { useAvailableLanguagesForDevice } from "@ledgerhq/live-common/manager/hooks";
import { useTranslation } from "react-i18next";
import Track from "~/renderer/analytics/Track";
import { track } from "~/renderer/analytics/segment";
import BigSpinner from "~/renderer/components/BigSpinner";
import ChangeDeviceLanguagePrompt from "~/renderer/components/ChangeDeviceLanguagePrompt";
import ChangeDeviceLanguageAction from "~/renderer/components/ChangeDeviceLanguageAction";

type Props = StepProps;

const StepDeviceLanguage = ({
  updatedDeviceInfo,
  device,
  deviceInfo: oldDeviceInfo,
  transitionTo,
}: Props) => {
  const currentLocale = useSelector(languageSelector) as Locale;

  const {
    availableLanguages: newAvailableLanguages,
    loaded: newLanguagesLoaded,
  } = useAvailableLanguagesForDevice(updatedDeviceInfo);
  const {
    availableLanguages: oldAvailableLanguages,
    loaded: oldLanguagesLoaded,
  } = useAvailableLanguagesForDevice(oldDeviceInfo);

  const [isLanguagePromptOpen, setIsLanguagePromptOpen] = useState<boolean>(false);

  const [languageToInstall, setLanguageToInstall] = useState<Language>("english");
  const [installingLanguage, setInstallingLanguage] = useState(false);

  const { t } = useTranslation();

  const deviceLocalizationFeatureFlag = useFeature("deviceLocalization");

  const installLanguage = useCallback((language: Language) => {
    setLanguageToInstall(language);
    setInstallingLanguage(true);
  }, []);

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
        deviceLocalizationFeatureFlag?.enabled
      ) {
        setIsLanguagePromptOpen(true);
      } else if (
        oldDeviceInfo?.languageId !== undefined &&
        oldDeviceInfo?.languageId !== languageIds.english
      ) {
        track("Page Manager FwUpdateReinstallLanguage");
        installLanguage(idsToLanguage[oldDeviceInfo.languageId]);
      } else {
        transitionTo("finish");
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
    deviceLocalizationFeatureFlag?.enabled,
    transitionTo,
  ]);

  const deviceName = getDeviceModel(device.modelId).productName;

  return (
    <Flex justifyContent="center" flex={1}>
      {isLanguagePromptOpen && !installingLanguage ? (
        <>
          <Track event="Page Manager FwUpdateDeviceLanguagePrompt" onMount />
          <ChangeDeviceLanguagePrompt
            descriptionWording={t("deviceLocalization.firmwareUpdatePrompt.description", {
              language: t(
                `deviceLocalization.languages.${localeIdToDeviceLanguage[currentLocale]}`,
              ),
              deviceName,
            })}
            deviceModelId={device.modelId}
            onSkip={() => {
              track("Page Manager FwUpdateDeviceLanguagePromptDismissed");
              transitionTo("finish");
            }}
            onConfirm={() => installLanguage(localeIdToDeviceLanguage[currentLocale] as Language)}
          />
        </>
      ) : null}
      {installingLanguage ? (
        <ChangeDeviceLanguageAction
          language={languageToInstall}
          onError={(error: Error) =>
            track("Page Manager FwUpdateLanguageInstallError", {
              error,
            })
          }
          onSuccess={() => {
            track("Page Manager FwUpdateLanguageInstalled", {
              selectedLanguage: languageToInstall,
            });
            setInstallingLanguage(false);
            transitionTo("finish");
          }}
        />
      ) : (
        !isLanguagePromptOpen && <BigSpinner size={50} />
      )}
    </Flex>
  );
};

export default StepDeviceLanguage;
