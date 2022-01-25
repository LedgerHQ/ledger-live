/* @flow */
import React, { useCallback } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { useTranslation } from "react-i18next";
import { useReboot } from "../../context/Reboot";
import SettingsRow from "../../components/SettingsRow";

export default function SignOut() {
  const { t } = useTranslation();
  const reboot = useReboot();

  const onResetAll = useCallback(async () => {
    await reboot(true);
  }, [reboot]);

  const onSignOut = useCallback(() => {
    Alert.alert(t("signout.confirm"), t("signout.disclaimer"), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("signout.action"), onPress: onResetAll },
    ]);
  }, [t, onResetAll]);

  return (
    <View style={styles.root}>
      <SettingsRow event="SignOutRow" onPress={onSignOut} center>
        <Text style={styles.signOutText}>{t("common.common.signOut")}</Text>
      </SettingsRow>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginVertical: 40,
  },
  signOutText: {
    color: "#c00",
  },
});
