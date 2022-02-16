// @flow

import React, { useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Trans, useTranslation } from "react-i18next";
import { View } from "react-native";
import { useTheme } from "@react-navigation/native";

import BottomModal from "./BottomModal";
import Button from "./Button";
import Circle from "./Circle";
import ModalBottomAction from "./ModalBottomAction";
import LanguageIcon from "../icons/Language";
import { languageSelector, languageIsSetByUserSelector } from "../reducers/settings";
import { setLanguage } from "../actions/settings";
import { getDefaultLanguageLocale } from "../languages";
import { useLanguageAvailableChecked } from "../context/Locale";
import { Track } from "../analytics";

export default function CheckLanguageAvailability() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [modalOpened, setModalOpened] = useState(true);
  const dispatch = useDispatch();
  const defaultLanguage = getDefaultLanguageLocale();
  const currAppLanguage = useSelector(languageSelector);
  const [hasAnswered, answer] = useLanguageAvailableChecked();
  const isLanguageSetByUser = useSelector(languageIsSetByUserSelector);

  const onRequestClose = useCallback(() => {
    setModalOpened(false);
  }, [setModalOpened]);

  const handleDismissPressed = useCallback(() => {
    answer();
    onRequestClose();
  }, [answer, onRequestClose]);

  const handleChangeLanguagePressed = useCallback(() => {
    dispatch(setLanguage(defaultLanguage));
    answer();
    onRequestClose();
  }, [dispatch, defaultLanguage, answer, onRequestClose]);

  const toShow =
    modalOpened &&
    !isLanguageSetByUser &&
    !hasAnswered &&
    currAppLanguage !== defaultLanguage &&
    currAppLanguage === "en";

  if (!toShow) {
    return null;
  }

  return (
    <>
      <Track
        onMount
        event={`Discoverability - Prompt - ${defaultLanguage}`}
        eventProperties={{ language: defaultLanguage }}
      />
      <BottomModal
        id="CheckLanguageAvailabilityModal"
        isOpened
        onClose={onRequestClose}
      >
        <ModalBottomAction
          title={<Trans i18nKey="systemLanguageAvailable.title" />}
          icon={
            <Circle bg={colors.lightLive} size={70}>
              <LanguageIcon size={40} color={colors.live} />
            </Circle>
          }
          description={
            <Trans
              i18nKey="systemLanguageAvailable.description.newSupport"
              values={{
                language: t(
                  `systemLanguageAvailable.languages.${defaultLanguage}`,
                ),
              }}
            />
          }
          footer={
            <View>
              <Button
                type="primary"
                event={`Discoverability - Switch - ${defaultLanguage}`}
                eventProperties={{ language: defaultLanguage }}
                title={
                  <>
                    <Trans
                      i18nKey="systemLanguageAvailable.switchButton"
                      values={{
                        language: t(
                          `systemLanguageAvailable.languages.${defaultLanguage}`,
                        ),
                      }}
                    />
                  </>
                }
                onPress={handleChangeLanguagePressed}
              />
              <Button
                type="secondary"
                outline={false}
                event={`Discoverability - Denied - ${defaultLanguage}`}
                eventProperties={{ language: defaultLanguage }}
                title={<Trans i18nKey="systemLanguageAvailable.no" />}
                onPress={handleDismissPressed}
              />
            </View>
          }
        />
      </BottomModal>
    </>
  );
}
