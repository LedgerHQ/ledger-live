// @flow

import React, { useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { Trans, useTranslation } from "react-i18next";
import { View } from "react-native";
import Locale from "react-native-locale";
import { useTheme } from "@react-navigation/native";
import i18next from "i18next";

import BottomModal from "./BottomModal";
import Button from "./Button";
import Circle from "./Circle";
import ModalBottomAction from "./ModalBottomAction";
import LanguageIcon from "../icons/Language";
import { languageSelector } from "../reducers/settings";
import { pushedLanguages } from "../languages";
import { useLanguageAvailableChecked } from "../context/Locale";
import { Track } from "../analytics";

export default function CheckLanguageAvailability() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [modalOpened, setModalOpened] = useState(true);
  const { localeIdentifier } = Locale.constants();
  const osLanguage = localeIdentifier.split("_")[0];
  const currAppLanguage = useSelector(languageSelector);
  const [hasAnswered, answer] = useLanguageAvailableChecked();

  const onRequestClose = useCallback(() => {
    setModalOpened(false);
  }, [setModalOpened]);

  const dontSwitchLanguage = useCallback(() => {
    answer();
    onRequestClose();
  }, [answer, onRequestClose]);

  const switchLanguage = useCallback(() => {
    i18next.changeLanguage(osLanguage);
    answer();
    onRequestClose();
  }, [osLanguage, answer, onRequestClose]);

  const toShow =
    modalOpened &&
    !hasAnswered &&
    currAppLanguage !== osLanguage &&
    pushedLanguages.includes(osLanguage);

  if (!toShow) {
    return null;
  }

  return (
    <>
      <Track
        onMount
        event={`Discoverability - Prompt - ${osLanguage}`}
        eventProperties={osLanguage}
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
                language: t(`systemLanguageAvailable.languages.${osLanguage}`),
              }}
            />
          }
          footer={
            <View>
              <Button
                type="primary"
                event={`Discoverability - Switch - ${osLanguage}`}
                eventProperties={{ language: osLanguage }}
                title={
                  <>
                    <Trans
                      i18nKey="systemLanguageAvailable.switchButton"
                      values={{
                        language: t(
                          `systemLanguageAvailable.languages.${osLanguage}`,
                        ),
                      }}
                    />
                  </>
                }
                onPress={switchLanguage}
              />
              <Button
                type="secondary"
                outline={false}
                event={`Discoverability - Denied - ${osLanguage}`}
                eventProperties={{ language: osLanguage }}
                title={<Trans i18nKey="systemLanguageAvailable.no" />}
                onPress={dontSwitchLanguage}
              />
            </View>
          }
        />
      </BottomModal>
    </>
  );
}
