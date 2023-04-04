import React, { useCallback, useEffect, useState } from "react";
import { ScrollView } from "react-native";
import { Button, Flex, SelectableList, Text } from "@ledgerhq/native-ui";
import { useDispatch } from "react-redux";
import {
  ArrowLeftMedium,
  ChevronBottomMedium,
} from "@ledgerhq/native-ui/assets/icons";
import styled from "styled-components/native";
import { useAvailableLanguagesForDevice } from "@ledgerhq/live-common/manager/hooks";
import { Device } from "@ledgerhq/types-devices";
import { getDeviceModel } from "@ledgerhq/devices";

import { useTranslation } from "react-i18next";
import { setLanguage } from "../../actions/settings";
import { useLocale } from "../../context/Locale";
import { languages, supportedLocales } from "../../languages";
import Illustration from "../../images/illustration/Illustration";
import DeviceDark from "../../images/illustration/Dark/_FamilyPackX.png";
import DeviceLight from "../../images/illustration/Light/_FamilyPackX.png";
import { TrackScreen, updateIdentify, track } from "../../analytics";
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

export type Props = {
  device: Device;
  productName: string;
};

const ScrollViewContainer = styled(ScrollView)`
  height: 100%;
`;

const LanguageSelect = ({ device, productName }: Props) => {
  const { t } = useTranslation();
  const { locale: currentLocale } = useLocale();
  const dispatch = useDispatch();
  const { availableLanguages: firmwareAvailableLanguages, loaded } =
    useAvailableLanguagesForDevice(device);

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

  const handleLanguageSelectOnChange = useCallback(
    language => {
      setSelectedLanguage(language);

      if (loaded && firmwareAvailableLanguages.includes(language)) {
        setLanguageSelectStatus("firmware-language-update-requested");
      } else {
        setLanguageSelectStatus("completed");
      }
    },
    [firmwareAvailableLanguages, loaded],
  );

  const handleLanguageSelectOnPress = useCallback(() => {
    track("button_clicked", { button: "language" });
    setLanguageSelectStatus("language-selection-requested");
  }, []);

  const handleLanguageSelectCancel = useCallback(() => {
    setLanguageSelectStatus("completed");
  }, []);

  const handleFirmwareLanguageUpdate = useCallback(() => {
    track("button_clicked", {
      button: `change ${getDeviceModel(device.modelId).productName} language`,
    });
    // TODO: redirect to firmware localization flow when available
  }, [device.modelId]);

  const handleFirmwareLanguageCancel = useCallback(() => {
    track("button_clicked", { button: "cancel change language" });
    setLanguageSelectStatus("completed");
  }, []);

  // Needed because the drawer can close if it loses the screen focus, or another drawer forces it to close
  const handleLanguageSelectOnClose = useCallback(() => {
    setLanguageSelectStatus("unrequested");
  }, []);

  // Handles the UI logic
  if (languageSelectStatus === "language-selection-requested") {
    nextDrawerToDisplay = "language-selection";
  } else if (languageSelectStatus === "firmware-language-update-requested") {
    nextDrawerToDisplay = "firmware-language-update";
  } else {
    nextDrawerToDisplay = "none";

    // // Resets entirely the drawer mechanism
    // if (currentDisplayedDrawer !== "none") {
    //   setCurrentDisplayedDrawer("none");
    // }
  }

  return (
    <Flex>
      <Button
        type="main"
        outline
        size="small"
        Icon={ChevronBottomMedium}
        iconPosition="right"
        onPress={handleLanguageSelectOnPress}
      >
        {currentLocale.toLocaleUpperCase()}
      </Button>
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
          <Flex flex={1}>
            <Button
              Icon={ArrowLeftMedium}
              onPress={handleLanguageSelectCancel}
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
      <QueuedDrawer
        preventBackdropClick
        isRequestingToBeOpened={
          nextDrawerToDisplay === "firmware-language-update"
        }
        onClose={handleFirmwareLanguageCancel}
      >
        <TrackScreen category="Change Stax language" />
        <Flex alignItems="center" justifyContent="center">
          <Illustration
            lightSource={DeviceLight}
            darkSource={DeviceDark}
            size={200}
          />
        </Flex>
        <Text variant="h4" fontWeight="semiBold" mb={4}>
          {t("syncOnboarding.firmwareLanguageUpdateDrawer.title", {
            productName,
          })}
        </Text>
        <Text variant="bodyLineHeight" mb={8} color="neutral.c80">
          {t("syncOnboarding.firmwareLanguageUpdateDrawer.description", {
            productName,
            newLanguage: selectedLanguage,
          })}
        </Text>
        <Button type="main" mb={4} onPress={handleFirmwareLanguageUpdate}>
          {t("syncOnboarding.firmwareLanguageUpdateDrawer.updateCta")}
        </Button>
        <Button onPress={handleFirmwareLanguageCancel}>
          {t("syncOnboarding.firmwareLanguageUpdateDrawer.cancelCta")}
        </Button>
      </QueuedDrawer>
    </Flex>
  );
};

export default LanguageSelect;
