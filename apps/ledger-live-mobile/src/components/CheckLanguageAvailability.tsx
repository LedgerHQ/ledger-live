import React, { useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Trans, useTranslation } from "react-i18next";
import { View } from "react-native";

import { IconsLegacy } from "@ledgerhq/native-ui";
import QueuedDrawer from "./QueuedDrawer";
import ModalBottomAction from "./ModalBottomAction";
import { languageIsSetByUserSelector } from "~/reducers/settings";
import { setLanguage } from "~/actions/settings";
import { getDefaultLanguageLocale } from "../languages";
import { useLanguageAvailableChecked } from "~/context/Locale";
import { Track, updateIdentify } from "~/analytics";
import Button from "./wrappedUi/Button";
import { useSettings } from "~/hooks";

export default function CheckLanguageAvailability() {
  const { t } = useTranslation();
  const { language } = useSettings();
  const [modalOpened, setModalOpened] = useState(true);
  const dispatch = useDispatch();
  const defaultLanguage = getDefaultLanguageLocale();
  const [hasAnswered, answer] = useLanguageAvailableChecked();
  const isLanguageSetByUser = useSelector(languageIsSetByUserSelector);

  const onRequestClose = useCallback(() => {
    setModalOpened(false);
  }, [setModalOpened]);

  const handleDismissPressed = useCallback(() => {
    if (typeof answer === "function") answer();
    onRequestClose();
  }, [answer, onRequestClose]);

  const handleChangeLanguagePressed = useCallback(() => {
    dispatch(setLanguage(defaultLanguage));
    updateIdentify();
    if (typeof answer === "function") answer();
    onRequestClose();
  }, [dispatch, defaultLanguage, answer, onRequestClose]);

  const toShow =
    modalOpened &&
    !isLanguageSetByUser &&
    !hasAnswered &&
    language !== defaultLanguage &&
    language === "en";

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
      <QueuedDrawer isRequestingToBeOpened onClose={onRequestClose}>
        <ModalBottomAction
          title={<Trans i18nKey="systemLanguageAvailable.title" />}
          icon={<IconsLegacy.LanguageMedium color="primary.c80" size={50} />}
          description={
            <Trans
              i18nKey="systemLanguageAvailable.description.newSupport"
              values={{
                language: t(`systemLanguageAvailable.languages.${defaultLanguage}`),
              }}
            />
          }
          footer={
            <View>
              <Button
                type="main"
                event={`Discoverability - Switch - ${defaultLanguage}`}
                eventProperties={{ language: defaultLanguage }}
                onPress={handleChangeLanguagePressed}
              >
                <Trans
                  i18nKey="systemLanguageAvailable.switchButton"
                  values={{
                    language: t(`systemLanguageAvailable.languages.${defaultLanguage}`),
                  }}
                />
              </Button>
              <Button
                type="main"
                outline
                mt={4}
                event={`Discoverability - Denied - ${defaultLanguage}`}
                eventProperties={{ language: defaultLanguage }}
                onPress={handleDismissPressed}
              >
                <Trans i18nKey="systemLanguageAvailable.no" />
              </Button>
            </View>
          }
        />
      </QueuedDrawer>
    </>
  );
}
