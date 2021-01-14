/* @flow */
import React, { useCallback, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { themeSelector } from "../../../reducers/settings";
import SettingsRow from "../../../components/SettingsRow";
import LText from "../../../components/LText";
import BottomModal from "../../../components/BottomModal";
import { setTheme } from "../../../actions/settings";
import Check from "../../../icons/Check";

export default function ThemeSettingsRow() {
  const theme = useSelector(themeSelector);
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const selectTheme = t => () => {
    dispatch(setTheme(t));
  };

  const onClose = useCallback(() => setIsOpen(false), []);

  return (
    <>
      <SettingsRow
        event="ThemeSettingsRow"
        title={<Trans i18nKey="settings.display.theme" />}
        desc={<Trans i18nKey="settings.display.themeDesc" />}
        arrowRight
        onPress={() => setIsOpen(true)}
        alignedTop
      >
        <LText semiBold color="grey">
          <Trans i18nKey={`settings.display.themes.${theme}`} />
        </LText>
      </SettingsRow>
      <BottomModal isOpened={isOpen} onClose={onClose}>
        <View style={styles.modal}>
          {["light", "dusk", "dark"].map((t, i) => (
            <TouchableOpacity
              key={t + i}
              onPress={selectTheme(t)}
              style={[styles.button]}
            >
              <LText
                {...(theme === t ? { semiBold: true } : {})}
                style={[styles.buttonLabel]}
              >
                {t}
              </LText>
              {theme === t && <Check size={16} color={colors.live} />}
            </TouchableOpacity>
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
  selectedLabel: {},
  modal: { padding: 8 },
});
