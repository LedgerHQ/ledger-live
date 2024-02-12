import React, { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { Text } from "@ledgerhq/native-ui";
import SettingsRow from "~/components/SettingsRow";
import { ScreenName } from "~/const";
import { useLocale } from "~/context/Locale";
import { languages } from "../../../languages";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { SettingsNavigatorStackParamList } from "~/components/RootNavigator/types/SettingsNavigator";

type Navigation = StackNavigatorProps<SettingsNavigatorStackParamList>;

const LanguageSettingsRow = () => {
  const { locale } = useLocale();
  const { navigate } = useNavigation<Navigation["navigation"]>();
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
      testID="language-button"
    >
      <Text variant={"body"} fontWeight={"medium"} color="primary.c80">
        {languages[locale] || locale}
      </Text>
    </SettingsRow>
  );
};

export default LanguageSettingsRow;
