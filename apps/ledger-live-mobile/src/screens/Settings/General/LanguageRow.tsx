import React, { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { Text } from "@ledgerhq/native-ui";
import SettingsRow from "../../../components/SettingsRow";
import { ScreenName } from "../../../const";
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

const LanguageSettingsRow = () => {
  const { locale } = useLocale();
  const { navigate } = useNavigation();
  const onNavigate = useCallback(() => {
    navigate(ScreenName.OnboardingLanguage);
  }, [navigate]);

  const { t } = useTranslation();

  return (
    <SettingsRow
      event="LanguageSettingsRow"
      title={t("settings.display.language")}
      desc={t("settings.display.languageDesc")}
      arrowRight
      onPress={onNavigate}
    >
      <Text variant={"body"} fontWeight={"medium"} color="primary.c80">
        {languageLabels[locale] || locale}
      </Text>
    </SettingsRow>
  );
};

export default LanguageSettingsRow;
