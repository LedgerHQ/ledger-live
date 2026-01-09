import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import getDeviceInfo from "@ledgerhq/live-common/hw/getDeviceInfo";
import { useAvailableLanguagesForDevice } from "@ledgerhq/live-common/manager/useAvailableLanguagesForDevice";
import { DeviceInfo, idsToLanguage } from "@ledgerhq/types-live";
import isEqual from "lodash/isEqual";
import React, { useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { Languages, Language } from "~/config/languages";
import { firstValueFrom, from } from "rxjs";
import { setLanguage, setLastSeenDevice } from "~/renderer/actions/settings";
import Track from "~/renderer/analytics/Track";
import { track } from "~/renderer/analytics/segment";
import Select from "~/renderer/components/Select";
import { setDrawer } from "~/renderer/drawers/Provider";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import {
  getInitialLanguageAndLocale,
  languageSelector,
  lastSeenDeviceSelector,
} from "~/renderer/reducers/settings";
import ChangeDeviceLanguagePromptDrawer from "./ChangeDeviceLanguagePromptDrawer";
import { useSupportedLanguages } from "~/renderer/hooks/useSupportedLanguages";

type ChangeLangArgs = { value: Language | null; label: string };

type Props = {
  disableLanguagePrompt?: boolean;
};

const LanguageSelectComponent: React.FC<Props> = ({ disableLanguagePrompt }) => {
  const language = useSelector(languageSelector);
  const lastSeenDevice = useSelector(lastSeenDeviceSelector);
  const { i18n } = useTranslation();
  const dispatch = useDispatch();
  const { locales: supportedLocales } = useSupportedLanguages();

  const { availableLanguages: availableDeviceLanguages } = useAvailableLanguagesForDevice(
    lastSeenDevice?.deviceInfo,
  );

  const currentDevice = useSelector(getCurrentDevice);
  const refreshDeviceInfo = useCallback(() => {
    if (currentDevice) {
      firstValueFrom(
        withDevice(currentDevice.deviceId)(transport => from(getDeviceInfo(transport))),
      ).then((deviceInfo: DeviceInfo) => {
        if (!isEqual(deviceInfo, lastSeenDevice?.deviceInfo))
          dispatch(setLastSeenDevice({ deviceInfo }));
      });
    }
  }, [currentDevice, lastSeenDevice?.deviceInfo, dispatch]);

  const options = useMemo(() => {
    return supportedLocales.map(language => {
      return {
        value: language,
        label: Languages[language].label,
      };
    });
  }, [supportedLocales]);

  const currentLanguage = useMemo(
    () => options.find(({ value }) => value === language) || options[0],
    [language, options],
  );

  useEffect(() => {
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [i18n, language]);

  const openDrawer = useCallback(
    (language?: Language | null) => {
      setDrawer(
        ChangeDeviceLanguagePromptDrawer,
        {
          deviceModelInfo: lastSeenDevice ?? undefined,
          analyticsContext: "Page LiveLanguageChange",
          onSuccess: refreshDeviceInfo,
          onError: refreshDeviceInfo,
          currentLanguage: language ?? getInitialLanguageAndLocale().language,
        },
        {},
      );
    },
    [lastSeenDevice, refreshDeviceInfo],
  );

  const handleChangeLanguage = useCallback(
    (language?: ChangeLangArgs) => {
      const deviceLanguageId = lastSeenDevice?.deviceInfo.languageId;
      const key = language?.value ?? getInitialLanguageAndLocale().language;
      const potentialDeviceLanguage = Languages[key].deviceSupport?.label;
      const langAvailableOnDevice =
        potentialDeviceLanguage !== undefined &&
        availableDeviceLanguages.includes(potentialDeviceLanguage);

      // firmware version verification is not really needed here, the presence of a language id
      // indicates that we are in a firmware that supports localization
      if (
        langAvailableOnDevice &&
        deviceLanguageId !== undefined &&
        idsToLanguage[deviceLanguageId] !== potentialDeviceLanguage &&
        !disableLanguagePrompt
      ) {
        track("Page LiveLanguageChange DeviceLanguagePrompt", {
          selectedLanguage: potentialDeviceLanguage,
        });
        openDrawer(language?.value);
      }

      dispatch(setLanguage(language?.value));
    },
    [
      lastSeenDevice?.deviceInfo.languageId,
      availableDeviceLanguages,
      disableLanguagePrompt,
      dispatch,
      openDrawer,
    ],
  );

  const avoidEmptyValue = useCallback(
    (language?: ChangeLangArgs | null) => language && handleChangeLanguage(language),
    [handleChangeLanguage],
  );

  return (
    <>
      <Track onUpdate event="LanguageSelect" currentRegion={currentLanguage.value} />

      <Select
        aria-label={
          // we only set the aria lavel once the device languages are fully loaded and available
          availableDeviceLanguages && availableDeviceLanguages.length > 0
            ? "Select language"
            : undefined
        }
        small
        minWidth={260}
        isSearchable={false}
        onChange={avoidEmptyValue}
        renderValue={({ data }) => data?.label}
        value={currentLanguage}
        options={options}
      />
    </>
  );
};

const LanguageSelect = React.memo(LanguageSelectComponent);
LanguageSelect.displayName = "LanguageSelect";

export default LanguageSelect;
