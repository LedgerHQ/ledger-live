import React, { useCallback, useEffect, useState } from "react";
import { I18nManager, Pressable } from "react-native";
import { Flex, SelectableList, Text } from "@ledgerhq/native-ui";
import { useDispatch } from "~/context/hooks";
import { DropdownMedium } from "@ledgerhq/native-ui/assets/icons";
import styled from "styled-components/native";

import RNRestart from "react-native-restart";
import { Trans, useTranslation, useLocale } from "~/context/Locale";
import { setLanguage } from "~/actions/settings";
import { languages, Locale } from "../../languages";
import { updateIdentify, track } from "~/analytics";
import QueuedDrawer from "~/components/QueuedDrawer";
import i18next from "i18next";
import Button from "~/components/Button";
import { useSupportedLocales } from "~/hooks/languages/useSupportedLocales";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
import {
  BottomSheetScrollView as LumenBottomSheetScrollView,
  BottomSheetHeader,
} from "@ledgerhq/lumen-ui-rnative";
import QueuedDrawerGorhom, {
  BottomSheetScrollView,
} from "LLM/components/QueuedDrawer/temp/QueuedDrawerGorhom";

type UiDrawerStatus = "none" | "language-selection" | "firmware-language-update";

type LanguageSelectStatus =
  | "unrequested"
  | "language-selection-requested"
  | "firmware-language-update-requested"
  | "completed";

const ScrollViewContainer = styled(BottomSheetScrollView)``;

const SNAP_POINTS = ["92%"];

const LanguageSelect = () => {
  const { t } = useTranslation();
  const { isEnabled } = useWalletFeaturesConfig("mobile");
  const { locale: currentLocale } = useLocale();
  const dispatch = useDispatch();
  const supportedLocales = useSupportedLocales();

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
      <Pressable onPress={handleLanguageSelectOnPress}>
        <Flex
          flexDirection="row"
          alignItems="center"
          height={"32px"}
          pl="12px"
          pr={3}
          bg="opacityDefault.c10"
          borderRadius={50}
          testID="language-select-button"
        >
          <Text mr="2px" testID="current-selected-language">
            {currentLocale.toLocaleUpperCase()}
          </Text>
          <DropdownMedium />
        </Flex>
      </Pressable>

      {isEnabled ? (
        <QueuedDrawerBottomSheet
          isRequestingToBeOpened={nextDrawerToDisplay === "language-selection"}
          onClose={handleLanguageSelectOnClose}
          enableBlurKeyboardOnGesture={true}
          snapPoints={SNAP_POINTS}
          preventBackdropClick
          enablePanDownToClose
        >
          <BottomSheetHeader
            spacing
            title={t("syncOnboarding.languageSelect.title")}
            appearance="expanded"
          />
          <LumenBottomSheetScrollView contentContainerStyle={{ paddingBottom: 24 }}>
            <SelectableList currentValue={currentLocale} onChange={handleLanguageSelectOnChange}>
              {supportedLocales.map((locale, index: number) => (
                <SelectableList.Element
                  key={index + locale}
                  value={locale}
                  testID={`language-select-${locale}`}
                >
                  {languages[locale]}
                </SelectableList.Element>
              ))}
            </SelectableList>
          </LumenBottomSheetScrollView>
        </QueuedDrawerBottomSheet>
      ) : (
        <QueuedDrawerGorhom
          isRequestingToBeOpened={nextDrawerToDisplay === "language-selection"}
          onClose={handleLanguageSelectOnClose}
          enableBlurKeyboardOnGesture={true}
          snapPoints={SNAP_POINTS}
          preventBackdropClick
          enablePanDownToClose
          keyboardBehavior="extend"
        >
          <Flex mb={4} flexDirection="row" alignItems="center" justifyContent="center">
            <Text
              variant="h5"
              fontWeight="semiBold"
              justifyContent="center"
              testID="language-select-drawer-title"
            >
              {t("syncOnboarding.languageSelect.title")}
            </Text>
          </Flex>
          <ScrollViewContainer contentContainerStyle={{ paddingBottom: 24 }}>
            <SelectableList currentValue={currentLocale} onChange={handleLanguageSelectOnChange}>
              {supportedLocales.map((locale, index: number) => (
                <SelectableList.Element
                  key={index + locale}
                  value={locale}
                  testID={`language-select-${locale}`}
                >
                  {languages[locale]}
                </SelectableList.Element>
              ))}
            </SelectableList>
          </ScrollViewContainer>
        </QueuedDrawerGorhom>
      )}

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
