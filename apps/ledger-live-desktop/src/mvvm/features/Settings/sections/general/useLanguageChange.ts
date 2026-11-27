import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import isEqual from "lodash/isEqual";
import { firstValueFrom, from } from "rxjs";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import getDeviceInfo from "@ledgerhq/live-common/hw/getDeviceInfo";
import { useAvailableLanguagesForDevice } from "@ledgerhq/live-common/manager/useAvailableLanguagesForDevice";
import { type DeviceInfo, idsToLanguage } from "@ledgerhq/types-live";
import { track } from "@shared/analytics";
import { shouldOfferDeviceLanguage } from "@features/flow-settings-general";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { type Language, Languages } from "~/config/languages";
import { setLanguage, setLastSeenDevice } from "~/renderer/actions/settings";
import { setDrawer } from "~/renderer/drawers/Provider";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { lastSeenDeviceSelector } from "~/renderer/reducers/settings";
import ChangeDeviceLanguagePromptDrawer from "~/renderer/screens/settings/sections/General/ChangeDeviceLanguagePromptDrawer";

/** Changes the app language, and offers to install it on the last seen device. */
export function useLanguageChange(): (language: Language) => void {
  const dispatch = useDispatch();
  const { i18n } = useTranslation();
  const lastSeenDevice = useSelector(lastSeenDeviceSelector);
  const currentDevice = useSelector(getCurrentDevice);
  const { availableLanguages: availableDeviceLanguages } = useAvailableLanguagesForDevice(
    lastSeenDevice?.deviceInfo,
  );

  const refreshDeviceInfo = useCallback(() => {
    if (!currentDevice) return;
    firstValueFrom(
      withDevice(currentDevice.deviceId)(transport => from(getDeviceInfo(transport))),
    ).then((deviceInfo: DeviceInfo) => {
      if (!isEqual(deviceInfo, lastSeenDevice?.deviceInfo)) {
        dispatch(setLastSeenDevice({ deviceInfo }));
      }
    });
  }, [currentDevice, lastSeenDevice?.deviceInfo, dispatch]);

  return useCallback(
    (language: Language) => {
      const deviceLanguageId = lastSeenDevice?.deviceInfo.languageId;
      const deviceLanguage = Languages[language].deviceSupport?.label;

      if (
        shouldOfferDeviceLanguage({
          pickedLanguage: deviceLanguage,
          availableLanguages: availableDeviceLanguages,
          lastSeenDevice:
            deviceLanguageId === undefined
              ? undefined
              : { language: idsToLanguage[deviceLanguageId] },
        })
      ) {
        track("Page LiveLanguageChange DeviceLanguagePrompt", { selectedLanguage: deviceLanguage });
        setDrawer(
          ChangeDeviceLanguagePromptDrawer,
          {
            deviceModelInfo: lastSeenDevice ?? undefined,
            analyticsContext: "Page LiveLanguageChange",
            onSuccess: refreshDeviceInfo,
            onError: refreshDeviceInfo,
            currentLanguage: language,
          },
          {},
        );
      }

      dispatch(setLanguage(language));
      i18n.changeLanguage(language);
    },
    [lastSeenDevice, availableDeviceLanguages, refreshDeviceInfo, dispatch, i18n],
  );
}
