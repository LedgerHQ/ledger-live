// @flow
import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";
import { useCleanCache } from "../../../actions/general";
import SettingsRow from "../../../components/SettingsRow";
import Warning from "../../../icons/Warning";
import { useReboot } from "../../../context/Reboot";
import ModalBottomAction from "../../../components/ModalBottomAction";
import Button from "../../../components/Button";
import Archive from "../../../icons/Archive";
import Circle from "../../../components/Circle";
import BottomModal from "../../../components/BottomModal";

export default function ClearCacheRow() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const cleanCache = useCleanCache();
  const reboot = useReboot();

  const [isModalOpened, setIsModalOpened] = useState(false);

  const onRequestClose = useCallback(() => {
    setIsModalOpened(false);
  }, []);

  const onPress = useCallback(() => {
    setIsModalOpened(true);
  }, []);

  const onClearCache = useCallback(async () => {
    await cleanCache();
    reboot();
  }, [cleanCache, reboot]);

  return (
    <>
      <SettingsRow
        event="ClearCacheRow"
        title={t("settings.help.clearCache")}
        desc={t("settings.help.clearCacheDesc")}
        iconLeft={
          <Circle bg="rgba(153,153,153,0.1)" size={32}>
            <Archive size={16} color={colors.grey} />
          </Circle>
        }
        onPress={onPress}
      />
      <BottomModal
        id="ClearCacheRow"
        isOpened={isModalOpened}
        onClose={onRequestClose}
      >
        <ModalBottomAction
          title={null}
          icon={
            <Circle bg={colors.lightLive} size={56}>
              <Warning size={24} color={colors.live} />
            </Circle>
          }
          description={t("settings.help.clearCacheModalDesc")}
          footer={
            <View style={styles.footerContainer}>
              <Button
                type="secondary"
                title={t("common.cancel")}
                onPress={onRequestClose}
                containerStyle={styles.buttonContainer}
                event="CancelClearCache"
              />
              <Button
                type="primary"
                title={t("settings.help.clearCacheButton")}
                onPress={onClearCache}
                containerStyle={[
                  styles.buttonContainer,
                  styles.buttonMarginLeft,
                ]}
                event="DoClearCache"
              />
            </View>
          }
        />
      </BottomModal>
    </>
  );
}

const styles = StyleSheet.create({
  footerContainer: {
    flexDirection: "row",
  },
  buttonContainer: {
    flex: 1,
  },
  buttonMarginLeft: { marginLeft: 16 },
});
