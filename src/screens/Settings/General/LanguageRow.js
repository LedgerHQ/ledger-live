/* @flow */
import React from "react";
import { useNavigation } from "@react-navigation/native";
import { Trans } from "react-i18next";
import SettingsRow from "../../../components/SettingsRow";
import LText from "../../../components/LText";
import { NavigatorName, ScreenName } from "../../../const";
import { useLocale } from "../../../context/Locale";

export default function LanguageSettingsRow() {
  const { locale } = useLocale();
  const { navigate } = useNavigation();

  return (
    <SettingsRow
      event="LanguageSettingsRow"
      title={<Trans i18nKey="settings.display.language" />}
      desc={<Trans i18nKey="settings.display.languageDesc" />}
      arrowRight
      onPress={() =>
        navigate(NavigatorName.Onboarding, {
          screen: ScreenName.OnboardingLanguage,
        })
      }
      alignedTop
    >
      <LText semiBold color="grey">
        {locale}
      </LText>
    </SettingsRow>
  );
}
