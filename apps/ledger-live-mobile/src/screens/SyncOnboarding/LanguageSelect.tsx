import React, { useCallback, useEffect, useState } from "react";
import { ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  BottomDrawer,
  Button,
  Flex,
  Link,
  SelectableList,
  Text,
} from "@ledgerhq/native-ui";
import { useDispatch } from "react-redux";
import {
  ArrowLeftMedium,
  ChevronBottomMedium,
  ExternalLinkMedium,
} from "@ledgerhq/native-ui/assets/icons";
import styled from "styled-components/native";

import { useTranslation } from "react-i18next";
import { ScreenName } from "../../const";
import { setLanguage } from "../../../actions/settings";
import { useLocale } from "../../context/Locale";
import {
  fullySupportedLocales,
  languages,
  supportedLocales,
} from "../../languages";
import Illustration from "../../images/illustration/Illustration";
import DeviceDark from "../../images/illustration/Dark/_FamilyPackX.png";
import DeviceLight from "../../images/illustration/Light/_FamilyPackX.png";

const ScrollViewContainer = styled(ScrollView)`
  height: 100%;
`;

// TODO: remove this when there's a real equivalent
const firmwareSupportedLocales = ["en", "fr", "es"];

const LanguageSelect = () => {
  const { t } = useTranslation();
  const { locale: currentLocale } = useLocale();
  const dispatch = useDispatch();
  const [isAnyModalDisplayed, setIsAnyModalDisplayed] = useState(false);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isFirmwareDrawerOpen, setFirmwareDrawerOpen] = useState(false);
  const [
    isNewSelectedLanguageFirmwareSupported,
    setIsNewSelectedLanguageFirmwareSupported,
  ] = useState<boolean>(false);

  const handleLanguageSelect = useCallback(
    language => {
      setDrawerOpen(false);
      dispatch(setLanguage(language));

      if (firmwareSupportedLocales.includes(language)) {
        setIsNewSelectedLanguageFirmwareSupported(true);
      } else {
        setIsNewSelectedLanguageFirmwareSupported(false);
      }
    },
    [dispatch],
  );

  const languageSelectOnPress = useCallback(() => {
    setDrawerOpen(true);
    setIsAnyModalDisplayed(true);
  }, []);

  useEffect(() => {
    if (!isAnyModalDisplayed && isNewSelectedLanguageFirmwareSupported) {
      setFirmwareDrawerOpen(true);
      setIsAnyModalDisplayed(true);
      setIsNewSelectedLanguageFirmwareSupported(false);
    }
  }, [isAnyModalDisplayed, isNewSelectedLanguageFirmwareSupported]);

  const handleFirmwareLanguageSelect = useCallback(() => {
    // TODO: redirect to firmware localization flow when available
  }, []);

  const handleFirmwareLanguageCancel = useCallback(() => {
    setFirmwareDrawerOpen(false);
    setIsAnyModalDisplayed(false);
  }, []);

  return (
    <Flex>
      <Button
        type="main"
        outline
        size="small"
        Icon={ChevronBottomMedium}
        iconPosition="right"
        onPress={languageSelectOnPress}
      >
        {currentLocale.toLocaleUpperCase()}
      </Button>
      <BottomDrawer
        noCloseButton
        preventBackdropClick
        isOpen={isDrawerOpen}
        onClose={() => setIsAnyModalDisplayed(false)}
      >
        <Flex
          mb={4}
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Flex flex={1}>
            <Button
              Icon={ArrowLeftMedium}
              onPress={() => setDrawerOpen(false)}
            />
          </Flex>
          <Text variant="h5" fontWeight="semiBold" justifyContent="center">
            {t("syncOnboarding.languageSelect.title")}
          </Text>
          <Flex flex={1} />
        </Flex>
        <ScrollViewContainer>
          <Flex>
            <SelectableList
              currentValue={currentLocale}
              onChange={handleLanguageSelect}
            >
              {supportedLocales.map((locale: string, index: number) => (
                <SelectableList.Element key={index + locale} value={locale}>
                  {languages[locale]}
                </SelectableList.Element>
              ))}
            </SelectableList>
          </Flex>
        </ScrollViewContainer>
      </BottomDrawer>
      <BottomDrawer
        preventBackdropClick
        isOpen={isFirmwareDrawerOpen}
        onClose={handleFirmwareLanguageCancel}
      >
        <Flex alignItems="center" justifyContent="center">
          <Illustration
            lightSource={DeviceLight}
            darkSource={DeviceDark}
            size={200}
          />
        </Flex>
        <Text variant="h4" fontWeight="semiBold" mb={4}>
          {t("syncOnboarding.firmwareLanguageUpdateDrawer.title")}
        </Text>
        <Text variant="bodyLineHeight" mb={8} color="neutral.c80">
          {t("syncOnboarding.firmwareLanguageUpdateDrawer.description")}
        </Text>
        <Button type="main" mb={4} onPress={handleFirmwareLanguageSelect}>
          {t("syncOnboarding.firmwareLanguageUpdateDrawer.updateCta")}
        </Button>
        <Button onPress={handleFirmwareLanguageCancel}>
          {t("syncOnboarding.firmwareLanguageUpdateDrawer.cancelCta")}
        </Button>
      </BottomDrawer>
    </Flex>
  );
};

export default LanguageSelect;
