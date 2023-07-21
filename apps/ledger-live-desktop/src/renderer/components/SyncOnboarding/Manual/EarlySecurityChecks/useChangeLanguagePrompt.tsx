import { useCallback, useEffect, useState } from "react";

import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { DeviceInfo, DeviceModelInfo, idsToLanguage } from "@ledgerhq/types-live";
import { from } from "rxjs";
import getDeviceInfo from "@ledgerhq/live-common/hw/getDeviceInfo";
import { isEqual } from "lodash";
import { useSelector } from "react-redux";
import { languageSelector } from "~/renderer/reducers/settings";
import { Locale, localeIdToDeviceLanguage } from "~/config/languages";
import { useAvailableLanguagesForDevice } from "@ledgerhq/live-common/manager/hooks";
import { setDrawer } from "~/renderer/drawers/Provider";
import ChangeDeviceLanguagePromptDrawer from "~/renderer/screens/settings/sections/General/ChangeDeviceLanguagePromptDrawer";

type useChangeLanguagePromptParams = {
  device: Device | undefined;
};

export const useChangeLanguagePrompt = ({ device }: useChangeLanguagePromptParams) => {
  const [deviceModelInfo, setDeviceModelInfo] = useState<DeviceModelInfo | null | undefined>();

  const refreshDeviceInfo = useCallback(() => {
    if (!device) return;
    withDevice(device.deviceId)(transport => from(getDeviceInfo(transport)))
      .toPromise()
      .then((deviceInfo: DeviceInfo) => {
        if (!isEqual(deviceInfo, deviceModelInfo?.deviceInfo))
          setDeviceModelInfo({ deviceInfo, modelId: device.modelId, apps: [] });
      });
  }, [device, deviceModelInfo?.deviceInfo]);

  const currentLanguage = useSelector(languageSelector) as Locale;

  useEffect(() => {
    if (!deviceModelInfo) refreshDeviceInfo();
  }, [deviceModelInfo, refreshDeviceInfo]);

  const { availableLanguages: availableDeviceLanguages, loaded } = useAvailableLanguagesForDevice(
    deviceModelInfo?.deviceInfo,
  );

  const [disableLanguagePrompt, setDisableLanguagePrompt] = useState(false);

  useEffect(() => {
    if (loaded && deviceModelInfo?.deviceInfo) {
      const deviceLanguageId = deviceModelInfo?.deviceInfo.languageId;
      const potentialDeviceLanguage =
        localeIdToDeviceLanguage[currentLanguage as keyof typeof localeIdToDeviceLanguage];
      const langAvailableOnDevice =
        potentialDeviceLanguage !== undefined &&
        availableDeviceLanguages.includes(potentialDeviceLanguage);

      if (
        langAvailableOnDevice &&
        deviceLanguageId !== undefined &&
        idsToLanguage[deviceLanguageId] !== potentialDeviceLanguage &&
        !disableLanguagePrompt
      ) {
        setDrawer(
          ChangeDeviceLanguagePromptDrawer,
          {
            deviceModelInfo,
            currentLanguage,
            analyticsContext: "Page SyncOnboarding",
            onClose: () => setDisableLanguagePrompt(true),
          },
          {},
        );
      }
    }
  }, [availableDeviceLanguages, deviceModelInfo, disableLanguagePrompt, loaded, currentLanguage]);
};
