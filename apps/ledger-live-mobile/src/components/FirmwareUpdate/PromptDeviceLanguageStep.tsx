import React, { useEffect, useState } from "react";

import { Flex } from "@ledgerhq/native-ui";
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
  let { availableLanguages, loaded } = useAvailableLanguagesForDevice(
    updatedDeviceInfo,
  );
  const [isDeviceLanguagePromptOpen, setIsDeviceLanguagePromptOpen] = useState<
    boolean
  >(false);
  const [
    deviceForChangeLanguageAction,
    setDeviceForChangeLanguageAction,
  ] = useState<Device | null>(null);

  const deviceLocalizationFeatureFlag = { enabled: true }; // useFeature("deviceLocalization");

  useEffect(() => {
    if (loaded) {
      const deviceLanguageId = updatedDeviceInfo?.languageId;
      const potentialDeviceLanguage = localeIdToDeviceLanguage[currentLocale];
      const langAvailableOnDevice =
        potentialDeviceLanguage !== undefined &&
        availableLanguages.includes(potentialDeviceLanguage);

      console.log({
        isDeviceLanguagePromptOpen,
        deviceForChangeLanguageAction,
        loaded,
        availableLanguages,
        updatedDeviceInfo,
      });
      // firmware version verification is not really needed here, the presence of a language id
      // indicates that we are in a firmware that supports localization
      if (
        langAvailableOnDevice &&
        deviceLanguageId !== undefined &&
        oldDeviceInfo?.languageId === undefined &&
        idsToLanguage[deviceLanguageId] !== potentialDeviceLanguage &&
        deviceLocalizationFeatureFlag.enabled
      ) {
        setIsDeviceLanguagePromptOpen(true);
      } else {
        dispatchEvent({ type: "languagePromptDismissed" });
      }
    }
  }, [availableLanguages, loaded]);

  return (
    <Flex alignItems="center">
      {isDeviceLanguagePromptOpen ? (
        <>
          <Track event="FirmwareUpdateFirstDeviceLanguagePrompt" onMount />
          <ChangeDeviceLanguagePrompt
            currentLocale={currentLocale}
            descriptionWording="This new framework version allows you to change the language of your device. Would you like to change your device language to French to match Live's language?"
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
