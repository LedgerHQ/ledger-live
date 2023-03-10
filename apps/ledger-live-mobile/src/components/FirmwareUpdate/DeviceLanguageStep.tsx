import React, { useCallback, useEffect, useState } from "react";

import { Flex } from "@ledgerhq/native-ui";
import { getDeviceModel } from "@ledgerhq/devices";
import {
  DeviceInfo,
  idsToLanguage,
  Language,
  languageIds,
} from "@ledgerhq/types-live";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useAvailableLanguagesForDevice } from "@ledgerhq/live-common/manager/hooks";

import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { FwUpdateForegroundEvent } from "./types";

import Track from "../../analytics/Track";
import { useLocale } from "../../context/Locale";
import { localeIdToDeviceLanguage } from "../../languages";

import ChangeDeviceLanguageAction from "../ChangeDeviceLanguageAction";
import ChangeDeviceLanguagePrompt from "../ChangeDeviceLanguagePrompt";
import DeviceActionProgress from "../DeviceActionProgress";
import { track } from "../../analytics";

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

  const {
    availableLanguages: newAvailableLanguages,
    loaded: newLanguagesLoaded,
  } = useAvailableLanguagesForDevice(updatedDeviceInfo);
  const {
    availableLanguages: oldAvailableLanguages,
    loaded: oldLanguagesLoaded,
  } = useAvailableLanguagesForDevice(oldDeviceInfo);

  const [isLanguagePromptOpen, setIsLanguagePromptOpen] =
    useState<boolean>(false);

  const [languageToInstall, setLanguageToInstall] =
    useState<Language>("english");
  const [deviceForAction, setDeviceForAction] = useState<Device | null>(null);

  const deviceLocalizationFeatureFlag = useFeature("deviceLocalization");

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
    deviceLocalizationFeatureFlag?.enabled,
  ]);

  const deviceModel = getDeviceModel(device.modelId);

  return (
    <Flex alignItems="center">
      {isLanguagePromptOpen && deviceForAction === null && (
        <>
          <Track event="Page Manager FwUpdateDeviceLanguagePrompt" onMount />
          <ChangeDeviceLanguagePrompt
            language={localeIdToDeviceLanguage[currentLocale] as Language}
            deviceModel={deviceModel}
            canSkip
            onSkip={() => {
              track("Page Manager FwUpdateDeviceLanguagePromptDismissed");
              dispatchEvent({ type: "languagePromptDismissed" });
            }}
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
          onError={(error: Error) => {
            track("Page Manager FwUpdateLanguageInstallError", {
              error,
            });
          }}
          onResult={() =>
            track("Page Manager FwUpdateLanguageInstalled", {
              selectedLanguage: languageToInstall,
            })
          }
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
