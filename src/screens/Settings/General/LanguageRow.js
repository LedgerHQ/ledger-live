/* @flow */
import React from "react";
import { StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Trans } from "react-i18next";
import SettingsRow from "../../../components/SettingsRow";
import LText from "../../../components/LText";
import colors from "../../../colors";
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
      <LText semiBold style={styles.tickerText}>
        {locale}
      </LText>
    </SettingsRow>
  );
}

const styles = StyleSheet.create({
  tickerText: {
    color: colors.grey,
  },
});
