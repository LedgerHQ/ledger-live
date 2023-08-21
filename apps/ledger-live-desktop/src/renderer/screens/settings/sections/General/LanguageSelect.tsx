import { DeviceModelId } from "@ledgerhq/devices";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import getDeviceInfo from "@ledgerhq/live-common/hw/getDeviceInfo";
import { useAvailableLanguagesForDevice } from "@ledgerhq/live-common/manager/hooks";
import { DeviceInfo, idsToLanguage } from "@ledgerhq/types-live";
import isEqual from "lodash/isEqual";
import React, { useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { Languages, Language } from "~/config/languages";
import { from } from "rxjs";
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
  useSystemLanguageSelector,
} from "~/renderer/reducers/settings";
import ChangeDeviceLanguagePromptDrawer from "./ChangeDeviceLanguagePromptDrawer";

type ChangeLangArgs = { value: Language | null; label: string };

type Props = {
  disableLanguagePrompt?: boolean;
};

const LanguageSelect: React.FC<Props> = ({ disableLanguagePrompt }) => {
  const useSystem = useSelector(useSystemLanguageSelector);
  const language = useSelector(languageSelector);
  const lastSeenDevice = useSelector(lastSeenDeviceSelector);
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();

  const { availableLanguages: availableDeviceLanguages } = useAvailableLanguagesForDevice(
    lastSeenDevice?.deviceInfo,
  );

  const currentDevice = useSelector(getCurrentDevice);
  const refreshDeviceInfo = useCallback(() => {
    if (currentDevice) {
      withDevice(currentDevice.deviceId)(transport => from(getDeviceInfo(transport)))
        .toPromise()
        .then((deviceInfo: DeviceInfo) => {
          if (!isEqual(deviceInfo, lastSeenDevice?.deviceInfo))
            dispatch(setLastSeenDevice({ deviceInfo }));
        });
    }
  }, [currentDevice, lastSeenDevice?.deviceInfo, dispatch]);

  const languages = useMemo(
    () =>
      [{ value: null as Language | null, label: t(`language.system`) }].concat(
        (Object.keys(Languages) as Array<keyof typeof Languages>).map(language => {
          return {
            value: language,
            label: Languages[language].label,
          };
        }),
      ),
    [t],
  );

  const selectedLanguage = useMemo(
    () => (useSystem ? languages[0] : languages.find(l => l.value === language)),
    [language, languages, useSystem],
  ) as {
    value: Language | null;
    label: string;
  };

  useEffect(() => {
    i18n.changeLanguage(language);
  }, [i18n, language]);

  const openDrawer = useCallback(
    language => {
      setDrawer(
        ChangeDeviceLanguagePromptDrawer,
        {
          deviceModeInfo: lastSeenDevice,
          analyticsContext: "Page LiveLanguageChange",
          onSuccess: refreshDeviceInfo,
          onError: refreshDeviceInfo,
          deviceModelId: lastSeenDevice?.modelId ?? DeviceModelId.nanoX,
          currentLanguage: language ?? getInitialLanguageAndLocale().language,
        },
        {},
      );
    },
    [lastSeenDevice, refreshDeviceInfo],
  );

  const avoidEmptyValue = (language?: ChangeLangArgs | null) =>
    language && handleChangeLanguage(language);

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

  return (
    <>
      <Track onUpdate event="LanguageSelect" currentRegion={selectedLanguage.value} />

      <Select
        aria-label="Select language"
        small
        minWidth={260}
        isSearchable={false}
        onChange={avoidEmptyValue}
        renderSelected={(item: { name: unknown } | undefined) => item && item.name}
        value={selectedLanguage}
        options={languages}
      />
    </>
  );
};

export default LanguageSelect;
