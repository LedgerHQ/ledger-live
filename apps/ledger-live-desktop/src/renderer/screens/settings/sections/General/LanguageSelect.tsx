import React, { useMemo, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import { DeviceModelId } from "@ledgerhq/devices";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
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

type ChangeLangArgs = { value: Locale; label: string };

type Props = {
  disableLanguagePrompt?: boolean;
};

const LanguageSelect: React.FC<Props> = ({ disableLanguagePrompt }) => {
  const useSystem = useSelector(useSystemLanguageSelector);
  const language = useSelector(languageSelector);
  const lastSeenDevice = useSelector(lastSeenDeviceSelector);
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();

  const [isDeviceLanguagePromptOpen, setIsDeviceLanguagePromptOpen] = useState<boolean>(false);

  const deviceLocalizationFeatureFlag = useFeature("deviceLocalization");
  // TODO: reactivate this feature flag once QA is done

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

  const handleChangeLanguage = useCallback(
    ({ value: languageKey }: ChangeLangArgs) => {
      const deviceLanguageId = lastSeenDevice?.deviceInfo.languageId;
      const potentialDeviceLanguage =
        localeIdToDeviceLanguage[languageKey ?? getInitialLanguageLocale()];
      const langAvailableOnDevice =
        potentialDeviceLanguage !== undefined &&
        availableDeviceLanguages.includes(potentialDeviceLanguage);

      // firmware version verification is not really needed here, the presence of a language id
      // indicates that we are in a firmware that supports localization
      if (
        langAvailableOnDevice &&
        deviceLanguageId !== undefined &&
        idsToLanguage[deviceLanguageId] !== potentialDeviceLanguage &&
        deviceLocalizationFeatureFlag?.enabled &&
        !disableLanguagePrompt
      ) {
        track("Page LiveLanguageChange DeviceLanguagePrompt", {
          selectedLanguage: potentialDeviceLanguage,
        });
        setIsDeviceLanguagePromptOpen(true);
      }

      dispatch(setLanguage(languageKey));
    },
    [
      lastSeenDevice?.deviceInfo.languageId,
      availableDeviceLanguages,
      deviceLocalizationFeatureFlag?.enabled,
      disableLanguagePrompt,
      dispatch,
    ],
  );

  const onClosePrompt = useCallback(() => {
    setIsDeviceLanguagePromptOpen(false);
  }, []);

  return (
    <>
      <Track onUpdate event="LanguageSelect" currentRegion={currentLanguage.value} />

      <Select
        aria-label="Select language"
        small
        minWidth={260}
        isSearchable={false}
        onChange={handleChangeLanguage}
        renderSelected={(item: { name: unknown } | undefined) => item && item.name}
        value={currentLanguage}
        options={languages}
      />

      <ChangeDeviceLanguagePromptDrawer
        deviceModelId={lastSeenDevice?.modelId ?? DeviceModelId.nanoX}
        isOpen={isDeviceLanguagePromptOpen}
        onClose={onClosePrompt}
        currentLanguage={(currentLanguage.value ?? getInitialLanguageLocale()) as Locale}
      />
    </>
  );
};

export default LanguageSelect;
