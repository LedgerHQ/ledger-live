import React, { useMemo, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import { DeviceModelId } from "@ledgerhq/devices";
import {
  allLanguages,
  prodStableLanguages,
  Locale,
  localeIdToDeviceLanguage,
} from "~/config/languages";
import useEnv from "~/renderer/hooks/useEnv";
import { setLanguage } from "~/renderer/actions/settings";
import {
  useSystemLanguageSelector,
  lastSeenDeviceSelector,
  languageSelector,
  getInitialLanguageLocale,
} from "~/renderer/reducers/settings";
import Select from "~/renderer/components/Select";
import { track } from "~/renderer/analytics/segment";
import Track from "~/renderer/analytics/Track";
import { useAvailableLanguagesForDevice } from "@ledgerhq/live-common/manager/hooks";
import { idsToLanguage } from "@ledgerhq/types-live";
import ChangeDeviceLanguagePromptDrawer from "./ChangeDeviceLanguagePromptDrawer";
import { setDrawer } from "~/renderer/drawers/Provider";

export const languageLabels: { [key in Locale]: string } = {
  de: "Deutsch",
  el: "Ελληνικά",
  en: "English",
  es: "Español",
  fi: "suomi",
  fr: "Français",
  hu: "magyar",
  it: "italiano",
  ja: "日本語",
  ko: "한국어",
  nl: "Nederlands",
  no: "Norsk",
  pl: "polski",
  pt: "Português (Brasil)",
  ru: "Русский",
  sr: "српски",
  sv: "svenska",
  tr: "Türkçe",
  zh: "简体中文",
};

type ChangeLangArgs = { value: Locale | null; label: string };

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

  const debugLanguage = useEnv("EXPERIMENTAL_LANGUAGES");

  const languages = useMemo(
    () =>
      [{ value: null as Locale | null, label: t(`language.system`) }].concat(
        (debugLanguage ? allLanguages : prodStableLanguages).map(key => ({
          value: key,
          label: languageLabels[key],
        })),
      ),
    [t, debugLanguage],
  );

  const currentLanguage = useMemo(
    () => (useSystem ? languages[0] : languages.find(l => l.value === language)),
    [language, languages, useSystem],
  ) as {
    value: Locale | null;
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
          deviceModelId: lastSeenDevice?.modelId ?? DeviceModelId.nanoX,
          currentLanguage: (language ?? getInitialLanguageLocale()) as Locale,
        },
        {},
      );
    },
    [lastSeenDevice?.modelId],
  );

  const avoidEmptyValue = (language?: ChangeLangArgs | null) =>
    language && handleChangeLanguage(language);

  const handleChangeLanguage = useCallback(
    (language?: ChangeLangArgs) => {
      const deviceLanguageId = lastSeenDevice?.deviceInfo.languageId;
      const key = language?.value ?? getInitialLanguageLocale();
      const potentialDeviceLanguage =
        localeIdToDeviceLanguage[key as keyof typeof localeIdToDeviceLanguage];
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
      <Track onUpdate event="LanguageSelect" currentRegion={currentLanguage.value} />

      <Select
        aria-label="Select language"
        small
        minWidth={260}
        isSearchable={false}
        onChange={avoidEmptyValue}
        renderSelected={(item: { name: unknown } | undefined) => item && item.name}
        value={currentLanguage}
        options={languages}
      />
    </>
  );
};

export default LanguageSelect;
