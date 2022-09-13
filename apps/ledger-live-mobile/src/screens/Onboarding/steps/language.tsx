import React, { useCallback } from "react";
import { I18nManager, ScrollView, Alert } from "react-native";
import { Trans } from "react-i18next";
import {
  Flex,
  SelectableList,
  IconBox,
  Icons,
  Text,
} from "@ledgerhq/native-ui";
import { StackScreenProps } from "@react-navigation/stack";
import { useDispatch } from "react-redux";
import i18next from "i18next";
import { useLocale } from "../../../context/Locale";
import { languages, supportedLocales } from "../../../languages";
import Button from "../../../components/Button";
import { ScreenName } from "../../../const";
import { setLanguage } from "../../../actions/settings";
import { useReboot } from "../../../context/Reboot";

// eslint-disable-next-line @typescript-eslint/ban-types
function OnboardingStepLanguage({ navigation }: StackScreenProps<{}>) {
  const { locale: currentLocale } = useLocale();
  const dispatch = useDispatch();
  const reboot = useReboot();

  const next = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const changeLanguageRTL = useCallback(
    async l => {
      await dispatch(setLanguage(l));
      I18nManager.forceRTL(true);
      reboot();
    },
    [I18nManager, i18next, reboot],
  );

  const changeLanguage = useCallback(
    async l => {
      const newDirection = i18next.dir(l);
      const currentDirection = I18nManager.isRTL ? "rtl" : "ltr";

      if (newDirection !== currentDirection) {
        Alert.alert(
          "Restart required",
          "The selected language requires the application to restart. Are you sure you want to continue?",
          [
            {
              text: "Cancel",
              style: "cancel",
            },
            {
              text: "OK",
              onPress: () => changeLanguageRTL(l),
            },
          ],
        );
      } else {
        dispatch(setLanguage(l));
      }
      // dispatch(setLanguage(l));
      // next();
    },
    [dispatch, next],
  );

  return (
    <Flex flex={1} p={6}>
      <ScrollView>
        <Flex mb={4}>
          <SelectableList
            currentValue={currentLocale}
            onChange={changeLanguage}
          >
            {supportedLocales.map((l, index) => (
              <SelectableList.Element key={index + l} value={l}>
                {languages[l]}
              </SelectableList.Element>
            ))}
          </SelectableList>
        </Flex>
      </ScrollView>
    </Flex>
  );
}

export function OnboardingStepLanguageGetStarted({
  navigation,
}: // eslint-disable-next-line @typescript-eslint/ban-types
StackScreenProps<{}>) {
  const next = () => {
    navigation.getParent()?.replace(ScreenName.OnboardingTermsOfUse);
  };

  return (
    <>
      <Flex flex={1} px={4} justifyContent="center" alignItems="center">
        <Flex mb={8}>
          <IconBox Icon={Icons.WarningMedium} />
        </Flex>
        <Text variant="large" mb={5} fontWeight="semiBold">
          <Trans i18nKey="onboarding.stepLanguage.warning.title" />
        </Text>
        <Text variant="body" color="palette.neutral.c80" textAlign="center">
          <Trans i18nKey="onboarding.stepLanguage.warning.desc" />
        </Text>
      </Flex>
      <Button
        type="primary"
        onPress={next}
        outline={false}
        title={<Trans i18nKey="onboarding.stepLanguage.cta" />}
      />
    </>
  );
}

export default OnboardingStepLanguage;
