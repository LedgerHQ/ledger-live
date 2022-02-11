/* @flow */
import React, { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { themeSelector } from "../../../reducers/settings";
import SettingsRow from "../../../components/SettingsRow";
import LText from "../../../components/LText";
import BottomModal from "../../../components/BottomModal";
import Touchable from "../../../components/Touchable";
import { setTheme } from "../../../actions/settings";
import Check from "../../../icons/Check";

export default function ThemeSettingsRow() {
  const { t } = useTranslation();
  const currentTheme = useSelector(themeSelector);
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const selectTheme = theme => () => {
    dispatch(setTheme(theme));
  };

  const onClose = useCallback(() => setIsOpen(false), []);

  return (
    <>
      <SettingsRow
        title={t("settings.display.theme")}
        desc={t("settings.display.themeDesc")}
        arrowRight
        onPress={() => setIsOpen(true)}
        alignedTop
      >
        <LText semiBold color="grey">
          {t(`settings.display.themes.${currentTheme}`)}
        </LText>
      </SettingsRow>
      <BottomModal isOpened={isOpen} onClose={onClose}>
        <View style={styles.modal}>
          {["light", "dark"].map((theme, i) => (
            <Touchable
              event="ThemeSettingsRow"
              eventProperties={{ theme }}
              key={theme + i}
              onPress={selectTheme(theme)}
              style={[styles.button]}
            >
              <LText
                {...(currentTheme === theme ? { semiBold: true } : {})}
                style={[styles.buttonLabel]}
              >
                {t(`settings.display.themes.${theme}`)}
              </LText>
              {currentTheme === theme && (
                <Check size={16} color={colors.live} />
              )}
            </Touchable>
          ))}
        </View>
      </BottomModal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 50,
    margin: 8,
    borderRadius: 4,
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: 8,
    flexDirection: "row",
  },
  buttonLabel: {
    fontSize: 16,
    textTransform: "capitalize",
  },
  modal: { padding: 8 },
});
