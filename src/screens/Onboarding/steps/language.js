// @flow

import React, { useCallback } from "react";
import {
  StyleSheet,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Trans } from "react-i18next";
import { useDispatch } from "react-redux";
import { useTheme } from "@react-navigation/native";
import { TrackScreen } from "../../../analytics";
import Button from "../../../components/Button";
import LText from "../../../components/LText";
import CheckBox from "../../../components/CheckBox";
import { useLocale } from "../../../context/Locale";
import { languages, supportedLocales } from "../../../languages";
import { setLanguage } from "../../../actions/settings";

function OnboardingStepLanguage({ navigation }: *) {
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const next = useCallback(() => {
    navigation.goBack();
  }, [navigation]);
  const { locale: currentLocale } = useLocale();

  const changeLanguage = useCallback(
    l => {
      dispatch(setLanguage(l));
      next();
    },
    [dispatch, next],
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.wrapper]}>
        <TrackScreen category="Onboarding" name="Language" />
        <LText semiBold style={styles.title}>
          <Trans i18nKey="onboarding.stepLanguage.title" />
        </LText>
        <ScrollView style={styles.localeContainer}>
          {supportedLocales.map((l, index) => (
            <TouchableOpacity
              key={index + l}
              onPress={() => changeLanguage(l)}
              style={[
                styles.localeButton,
                {
                  borderColor: l === currentLocale ? colors.live : colors.fog,
                },
              ]}
            >
              <CheckBox isChecked={l === currentLocale} />
              <LText semiBold style={styles.localeButtonLabel}>
                {languages[l]}
              </LText>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Button
          event="Onboarding - Language confirm"
          type="primary"
          onPress={next}
          title={<Trans i18nKey="onboarding.stepLanguage.cta" />}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  wrapper: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 16,
    marginBottom: 16,
  },
  languageLabel: { fontSize: 10, marginRight: 8 },
  localeContainer: {
    flex: 1,
  },
  localeButton: {
    width: "100%",
    borderRadius: 4,
    borderWidth: 1,
    marginVertical: 8,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  localeButtonLabel: { fontSize: 18, marginLeft: 10 },
});

export default OnboardingStepLanguage;
