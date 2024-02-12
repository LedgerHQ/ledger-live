import React, { useCallback, useEffect, useState } from "react";
import { I18nManager, ScrollView } from "react-native";
import { Flex, SelectableList, Text } from "@ledgerhq/native-ui";
import { useDispatch } from "react-redux";
import { CloseMedium, DropdownMedium } from "@ledgerhq/native-ui/assets/icons";
import styled from "styled-components/native";

import RNRestart from "react-native-restart";
import { Trans, useTranslation } from "react-i18next";
import { TouchableOpacity } from "react-native-gesture-handler";
import { setLanguage } from "~/actions/settings";
import { useLocale } from "~/context/Locale";
import { languages, supportedLocales, Locale } from "../../languages";
import { updateIdentify, track } from "~/analytics";
import QueuedDrawer from "~/components/QueuedDrawer";
import i18next from "i18next";
import Button from "~/components/Button";

type UiDrawerStatus = "none" | "language-selection" | "firmware-language-update";

type LanguageSelectStatus =
  | "unrequested"
  | "language-selection-requested"
  | "firmware-language-update-requested"
  | "completed";

const ScrollViewContainer = styled(ScrollView)`
  height: 100%;
`;

const LanguageSelect = () => {
  const { t } = useTranslation();
  const { locale: currentLocale } = useLocale();
  const dispatch = useDispatch();

  // Will be computed depending on the states. Updating nextDrawerToDisplay
  // triggers the current displayed drawer to close
  let nextDrawerToDisplay: UiDrawerStatus = "none";

  const [selectedLanguage, setSelectedLanguage] = useState("");

  const [languageSelectStatus, setLanguageSelectStatus] =
    useState<LanguageSelectStatus>("unrequested");

  const [isRestartPromptOpened, setRestartPromptOpened] = useState<boolean>(false);

  const toggleModal = useCallback(
    () => setRestartPromptOpened(!isRestartPromptOpened),
    [isRestartPromptOpened],
  );
  const closeRestartPromptModal = () => {
    setRestartPromptOpened(false);
  };

  // no useCallBack around RNRRestart, or the app might crash.
  const changeLanguageRTL = async () => {
    await Promise.all([
      I18nManager.forceRTL(!I18nManager.isRTL),
      dispatch(setLanguage(selectedLanguage)),
      updateIdentify(),
    ]);
    setTimeout(() => RNRestart.Restart(), 0);
  };

  // Handles a newly selected language to redux-dispatch
  useEffect(() => {
    if (selectedLanguage) {
      const newDirection = i18next.dir(selectedLanguage);
      const currentDirection = I18nManager.isRTL ? "rtl" : "ltr";

      if (newDirection !== currentDirection) {
        dispatch(setLanguage(selectedLanguage));
        toggleModal();
      }

      dispatch(setLanguage(selectedLanguage));
      updateIdentify();
    }
  }, [dispatch, selectedLanguage, toggleModal]);

  const handleLanguageSelectOnChange = useCallback((l: Locale) => {
    setSelectedLanguage(l);

    setLanguageSelectStatus("completed");
  }, []);

  const handleLanguageSelectOnPress = useCallback(() => {
    track("button_clicked", { button: "language" });
    setLanguageSelectStatus("language-selection-requested");
  }, []);

  const handleLanguageSelectCancel = useCallback(() => {
    setLanguageSelectStatus("completed");
  }, []);

  // Needed because the drawer can close if it loses the screen focus, or another drawer forces it to close
  const handleLanguageSelectOnClose = useCallback(() => {
    setLanguageSelectStatus("unrequested");
  }, []);

  // Handles the UI logic
  if (languageSelectStatus === "language-selection-requested") {
    nextDrawerToDisplay = "language-selection";
  } else {
    nextDrawerToDisplay = "none";
  }

  return (
    <Flex>
      <TouchableOpacity onPress={handleLanguageSelectOnPress}>
        <Flex
          flexDirection="row"
          alignItems="center"
          height={"32px"}
          pl="12px"
          pr={3}
          bg="opacityDefault.c10"
          borderRadius="50"
        >
          <Text mr="2px">{currentLocale.toLocaleUpperCase()}</Text>
          <DropdownMedium />
        </Flex>
      </TouchableOpacity>

      <QueuedDrawer
        noCloseButton
        preventBackdropClick
        isRequestingToBeOpened={nextDrawerToDisplay === "language-selection"}
        onClose={handleLanguageSelectOnClose}
      >
        <Flex mb={4} flexDirection="row" alignItems="center" justifyContent="space-between">
          <Flex flex={1} />
          <Text variant="h5" fontWeight="semiBold" justifyContent="center">
            {t("syncOnboarding.languageSelect.title")}
          </Text>
          <Flex flex={1} alignItems="flex-end">
            <Button Icon={CloseMedium} onPress={handleLanguageSelectCancel} />
          </Flex>
        </Flex>
        <ScrollViewContainer>
          <Flex>
            <SelectableList currentValue={currentLocale} onChange={handleLanguageSelectOnChange}>
              {supportedLocales.map((locale, index: number) => (
                <SelectableList.Element key={index + locale} value={locale}>
                  {languages[locale]}
                </SelectableList.Element>
              ))}
            </SelectableList>
          </Flex>
        </ScrollViewContainer>
      </QueuedDrawer>

      <QueuedDrawer
        isRequestingToBeOpened={isRestartPromptOpened}
        preventBackdropClick={false}
        title={<Trans i18nKey={"onboarding.stepLanguage.RestartModal.title"} />}
        description={<Trans i18nKey={"onboarding.stepLanguage.RestartModal.paragraph"} />}
        onClose={closeRestartPromptModal}
      >
        <Flex flexDirection={"row"}>
          <Button
            event="ConfirmationModalCancel"
            type="secondary"
            flexGrow="1"
            title={<Trans i18nKey="common.cancel" />}
            onPress={closeRestartPromptModal}
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
      </QueuedDrawer>
    </Flex>
  );
};

export default LanguageSelect;
