/* @flow */
import { useTheme } from "@react-navigation/native";
import React, { memo } from "react";
import { Trans } from "react-i18next";
import { View, Linking, StyleSheet } from "react-native";
import SettingsRow from "../../../components/SettingsRow";
import { urls } from "../../../config/urls";
import ExternalLink from "../../../icons/ExternalLink";

function PrivacyPolicyRow() {
  const { colors } = useTheme();
  return (
    <SettingsRow
      event="PrivacyPolicyRow"
      title={<Trans i18nKey="settings.about.privacyPolicy" />}
      desc={<Trans i18nKey="settings.about.privacyPolicyDesc" />}
      onPress={() => Linking.openURL(urls.privacyPolicy)}
      alignedTop
    >
      <View style={styles.externalLinkContainer}>
        <ExternalLink size={16} color={colors.grey} />
      </View>
    </SettingsRow>
  );
}

const styles = StyleSheet.create({
  externalLinkContainer: { marginHorizontal: 10 },
});

export default memo<*>(PrivacyPolicyRow);
