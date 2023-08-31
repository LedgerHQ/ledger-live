import useIsMounted from "@ledgerhq/live-common/hooks/useIsMounted";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import getDeviceInfo from "@ledgerhq/live-common/hw/getDeviceInfo";
import { useAvailableLanguagesForDevice } from "@ledgerhq/live-common/manager/hooks";
import { DeviceInfo, DeviceModelInfo, idsToLanguage } from "@ledgerhq/types-live";
import { isEqual } from "lodash";
import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { firstValueFrom, from } from "rxjs";
import { Languages } from "~/config/languages";
import { setDrawer } from "~/renderer/drawers/Provider";
import { languageSelector } from "~/renderer/reducers/settings";
import ChangeDeviceLanguagePromptDrawer from "~/renderer/screens/settings/sections/General/ChangeDeviceLanguagePromptDrawer";

type UseChangeLanguagePromptParams = {
  device: Device | undefined;
};

export const useChangeLanguagePrompt = ({ device }: UseChangeLanguagePromptParams) => {
  const [deviceModelInfo, setDeviceModelInfo] = useState<DeviceModelInfo | null | undefined>();

  const isMounted = useIsMounted();

  const refreshDeviceInfo = useCallback(() => {
    if (!device) return;
    firstValueFrom(withDevice(device.deviceId)(transport => from(getDeviceInfo(transport)))).then(
      (deviceInfo: DeviceInfo) => {
        if (!isMounted()) return;
        if (!isEqual(deviceInfo, deviceModelInfo?.deviceInfo))
          setDeviceModelInfo({ deviceInfo, modelId: device.modelId, apps: [] });
      },
    );
  }, [device, deviceModelInfo?.deviceInfo, isMounted]);

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
