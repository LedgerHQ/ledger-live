import React, { useCallback, useEffect, useState } from "react";
import { ScrollView } from "react-native";
import { Button, Flex, SelectableList, Text } from "@ledgerhq/native-ui";
import { useDispatch } from "react-redux";
import { CloseMedium, DropdownMedium } from "@ledgerhq/native-ui/assets/icons";
import styled from "styled-components/native";

import { useTranslation } from "react-i18next";
import { TouchableOpacity } from "react-native-gesture-handler";
import { setLanguage } from "../../actions/settings";
import { useLocale } from "../../context/Locale";
import { languages, supportedLocales } from "../../languages";
import { updateIdentify, track } from "../../analytics";
import QueuedDrawer from "../../components/QueuedDrawer";

type UiDrawerStatus =
  | "none"
  | "language-selection"
  | "firmware-language-update";

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

  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);

  const [languageSelectStatus, setLanguageSelectStatus] =
    useState<LanguageSelectStatus>("unrequested");

  // Handles a newly selected language to redux-dispatch
  useEffect(() => {
    if (selectedLanguage) {
      dispatch(setLanguage(selectedLanguage));
      updateIdentify();
    }
  }, [dispatch, selectedLanguage]);

  const handleLanguageSelectOnChange = useCallback(language => {
    setSelectedLanguage(language);

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
        <Flex
          mb={4}
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
        >
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
            <SelectableList
              currentValue={currentLocale}
              onChange={handleLanguageSelectOnChange}
            >
              {supportedLocales.map((locale, index: number) => (
                <SelectableList.Element key={index + locale} value={locale}>
                  {languages[locale]}
                </SelectableList.Element>
              ))}
            </SelectableList>
          </Flex>
        </ScrollViewContainer>
      </QueuedDrawer>
    </Flex>
  );
};

export default LanguageSelect;
