import { track } from "@shared/analytics";
import React, { useCallback, useEffect, useState } from "react";
import { useAvailableLanguagesForDevice } from "@ledgerhq/live-common/manager/useAvailableLanguagesForDevice";
import { useGetDeviceInfo } from "@ledgerhq/live-common/deviceSDK/hooks/useGetDeviceInfo";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Flex } from "@ledgerhq/native-ui";
import { DeviceModelId, getDeviceModel } from "@ledgerhq/devices";

import { useLocale } from "~/context/Locale";
import { localeIdToDeviceLanguage } from "../../languages";
import { Language, idsToLanguage } from "@ledgerhq/types-live";
import QueuedDrawer from "~/components/QueuedDrawer";
import ChangeDeviceLanguageAction from "~/components/ChangeDeviceLanguageAction";
import ChangeDeviceLanguagePrompt from "~/components/ChangeDeviceLanguagePrompt";

export const LANGUAGE_CHECK_TIMEOUT_MS = 10_000;

export type LanguagePromptProps = {
  /**
   * A `Device` object
   */
  device: Device;
  /**
   * Called when the prompt will not show, or once the user closed it.
   */
  onDone?: () => void;
};

export const LanguagePrompt: React.FC<LanguagePromptProps> = ({ device, onDone }) => {
  const { deviceInfo, error: deviceInfoError } = useGetDeviceInfo({
    deviceId: device.deviceId,
    deviceName: device.deviceName ?? null,
  });
  const { availableLanguages, loaded: availableLanguagesLoaded } =
    useAvailableLanguagesForDevice(deviceInfo);

  const [deviceLanguagePromptDismissed, setDeviceLanguagePromptDismissed] =
    useState<boolean>(false);
  const [preventPromptBackdropClick, setPreventPromptBackdropClick] = useState<boolean>(false);
  const [deviceForChangeLanguageAction, setDeviceForChangeLanguageAction] = useState<Device | null>(
    null,
  );

  const { locale: currentLocale } = useLocale();

  const potentialDeviceLanguage = localeIdToDeviceLanguage[currentLocale];
  const deviceLanguageId = deviceInfo?.languageId;
  const languagesDiffer =
    potentialDeviceLanguage !== undefined &&
    availableLanguages.includes(potentialDeviceLanguage) &&
    deviceLanguageId !== undefined &&
    idsToLanguage[deviceLanguageId] !== potentialDeviceLanguage;

  const checkDone = deviceInfoError !== null || (deviceInfo !== null && availableLanguagesLoaded);
  const isDeviceLanguagePromptOpen = checkDone && languagesDiffer && !deviceLanguagePromptDismissed;
  const done = checkDone && !isDeviceLanguagePromptOpen;

  useEffect(() => {
    if (done) onDone?.();
  }, [done, onDone]);

  useEffect(() => {
    if (!onDone || checkDone) return;
    const timeout = setTimeout(onDone, LANGUAGE_CHECK_TIMEOUT_MS);
    return () => clearTimeout(timeout);
  }, [onDone, checkDone]);

  const closeDeviceLanguagePrompt = useCallback(() => {
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
