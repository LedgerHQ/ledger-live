import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import getDeviceInfo from "@ledgerhq/live-common/hw/getDeviceInfo";
import { useAvailableLanguagesForDevice } from "@ledgerhq/live-common/manager/hooks";
import { DeviceModelInfo, idsToLanguage } from "@ledgerhq/types-live";
import { isEqual } from "lodash";
import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { from, lastValueFrom } from "rxjs";
import { Languages } from "~/config/languages";
import { setDrawer } from "~/renderer/drawers/Provider";
import { languageSelector } from "~/renderer/reducers/settings";
import ChangeDeviceLanguagePromptDrawer from "~/renderer/screens/settings/sections/General/ChangeDeviceLanguagePromptDrawer";

type useChangeLanguagePromptParams = {
  device: Device | undefined;
};

export const useChangeLanguagePrompt = ({ device }: useChangeLanguagePromptParams) => {
  const [deviceModelInfo, setDeviceModelInfo] = useState<DeviceModelInfo | null | undefined>();

  const refreshDeviceInfo = useCallback(async () => {
    if (!device) return;
    const deviceInfo = await lastValueFrom(
      withDevice(device.deviceId)(transport => from(getDeviceInfo(transport))),
    );

    if (!isEqual(deviceInfo, deviceModelInfo?.deviceInfo)) {
      setDeviceModelInfo({ deviceInfo, modelId: device.modelId, apps: [] });
    }
  }, [device, deviceModelInfo?.deviceInfo]);

  const currentLanguage = useSelector(languageSelector);

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
      const potentialDeviceLanguage = Languages[currentLanguage].deviceSupport?.label;
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
