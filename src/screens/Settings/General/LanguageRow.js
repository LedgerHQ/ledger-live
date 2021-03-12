/* @flow */
import React, { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import { Trans } from "react-i18next";
import SettingsRow from "../../../components/SettingsRow";
import LText from "../../../components/LText";
import { NavigatorName, ScreenName } from "../../../const";
import { useLocale } from "../../../context/Locale";

export default function LanguageSettingsRow() {
  const { locale } = useLocale();
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
      title={<Trans i18nKey="settings.display.language" />}
      desc={<Trans i18nKey="settings.display.languageDesc" />}
      arrowRight
      onPress={onNavigate}
      alignedTop
    >
      <LText semiBold color="grey">
        {locale}
      </LText>
    </SettingsRow>
  );
}
