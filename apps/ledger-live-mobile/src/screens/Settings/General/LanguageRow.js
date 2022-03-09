/* @flow */
import React, { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import SettingsRow from "../../../components/SettingsRow";
import LText from "../../../components/LText";
import { NavigatorName, ScreenName } from "../../../const";
import { useLocale } from "../../../context/Locale";

export const languageLabels = {
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
  pt: "português",
  ru: "Русский",
  sr: "српски",
  sv: "svenska",
  tr: "Türkçe",
  zh: "简体中文",
};

export default function LanguageSettingsRow() {
  const { locale } = useLocale();
  const { t } = useTranslation();
  const { navigate } = useNavigation();
  const onNavigate = useCallback(() => {
    navigate(NavigatorName.BaseOnboarding, {
      screen: NavigatorName.Onboarding,
      params: {
        screen: ScreenName.OnboardingLanguage,
      },
    });
  }, [navigate]);

  return (
    <SettingsRow
      event="LanguageSettingsRow"
      title={t("settings.display.language")}
      desc={t("settings.display.languageDesc")}
      arrowRight
      onPress={onNavigate}
      alignedTop
    >
      <LText semiBold color="grey">
        {languageLabels[locale] || locale}
      </LText>
    </SettingsRow>
  );
}
