import React, { useCallback, useState } from "react";
import { I18nManager, ScrollView, Alert } from "react-native";
import { Trans } from "react-i18next";
import {
  Flex,
  SelectableList,
  IconBox,
  Icons,
  Text,
  BottomDrawer,
} from "@ledgerhq/native-ui";
import { StackScreenProps } from "@react-navigation/stack";
import { useDispatch } from "react-redux";
import i18next from "i18next";
import RNRestart from "react-native-restart";
import { useLocale } from "../../../context/Locale";
import { languages, supportedLocales } from "../../../languages";
import Button from "../../../components/Button";
import { ScreenName } from "../../../const";
import { setLanguage } from "../../../actions/settings";

// eslint-disable-next-line @typescript-eslint/ban-types
function OnboardingStepLanguage({ navigation }: StackScreenProps<{}>) {
  const { locale: currentLocale } = useLocale();
  const dispatch = useDispatch();

  const [isOpened, setOpened] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("");

  const toggleModal = useCallback(() => setOpened(!isOpened), [isOpened]);
  const closeModal = () => {
    setOpened(false);
  };

  const next = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const changeLanguageRTL = useCallback(() => {
    dispatch(setLanguage(selectedLanguage));
    I18nManager.forceRTL(!I18nManager.isRTL);
    RNRestart.Restart();
  }, [selectedLanguage, dispatch]);

  const changeLanguage = useCallback(
    async l => {
      const newDirection = i18next.dir(l);
      const currentDirection = I18nManager.isRTL ? "rtl" : "ltr";
      if (newDirection !== currentDirection) {
        setSelectedLanguage(l);
        toggleModal();
      } else {
        dispatch(setLanguage(l));
        next();
      }
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
        <BottomDrawer
          id="ContractAddress"
          isOpen={isOpened}
          preventBackdropClick={false}
          title={
            <Trans i18nKey={"onboarding.stepLanguage.RestartModal.title"} />
          }
          description={
            <Trans i18nKey={"onboarding.stepLanguage.RestartModal.paragraph"} />
          }
          onClose={closeModal}
        >
          <Flex flexDirection={"row"}>
            <Button
              event="ConfirmationModalCancel"
              type="secondary"
              flexGrow="1"
              title={<Trans i18nKey="common.cancel" />}
              onPress={closeModal}
              marginRight={4}
            />
            <Button
              event="ConfirmationModalConfirm"
              type={"primary"}
              flexGrow="1"
              title={<Trans i18nKey="common.restart" />}
              onPress={changeLanguageRTL}
            />
          </Flex>
        </BottomDrawer>
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
