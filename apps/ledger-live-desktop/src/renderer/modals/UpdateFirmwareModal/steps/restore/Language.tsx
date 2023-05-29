import React, { useCallback, useEffect, useState } from "react";
import { StepProps } from "../..";
import { idsToLanguage, Language as LanguageType, languageIds } from "@ledgerhq/types-live";
import { Flex } from "@ledgerhq/react-ui";
import { useSelector } from "react-redux";
import { languageSelector } from "~/renderer/reducers/settings";
import { Locale, localeIdToDeviceLanguage } from "~/config/languages";
import { useAvailableLanguagesForDevice } from "@ledgerhq/live-common/manager/hooks";
import { track } from "~/renderer/analytics/segment";
import ChangeDeviceLanguageAction from "~/renderer/components/ChangeDeviceLanguageAction";
import { renderLoading } from "~/renderer/components/DeviceAction/rendering";

type Props = Partial<StepProps> & { onDone: () => void; setError: (arg0: Error) => void };

const Language = ({ updatedDeviceInfo, deviceInfo: oldDeviceInfo, onDone, setError }: Props) => {
  const [isLanguagePromptOpen, setIsLanguagePromptOpen] = useState<boolean>(false);
  const [languageToInstall, setLanguageToInstall] = useState<LanguageType>("english");
  const [installingLanguage, setInstallingLanguage] = useState(false);

  const currentLocale = useSelector(languageSelector) as Locale;

  const {
    availableLanguages: newAvailableLanguages,
    loaded: newLanguagesLoaded,
  } = useAvailableLanguagesForDevice(updatedDeviceInfo);

  const {
    availableLanguages: oldAvailableLanguages,
    loaded: oldLanguagesLoaded,
  } = useAvailableLanguagesForDevice(oldDeviceInfo);

  const installLanguage = useCallback((language: LanguageType) => {
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
        idsToLanguage[deviceLanguageId] !== potentialDeviceLanguage
      ) {
        setIsLanguagePromptOpen(true);
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
    onDone,
  ]);

  return (
    <Flex justifyContent="center" flex={1}>
      {installingLanguage ? (
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
