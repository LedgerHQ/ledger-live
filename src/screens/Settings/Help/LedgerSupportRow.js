/* @flow */
import React, { PureComponent } from "react";
import { Trans } from "react-i18next";
import { View, Linking, StyleSheet } from "react-native";
import colors from "../../../colors";
import { urls } from "../../../config/urls";
import SettingsRow from "../../../components/SettingsRow";
import ExternalLink from "../../../icons/ExternalLink";

class LedgerSupportRow extends PureComponent<*> {
  render() {
    return (
      <SettingsRow
        event="LedgerSupportRow"
        title={<Trans i18nKey="settings.help.support" />}
        desc={<Trans i18nKey="settings.help.supportDesc" />}
        onPress={() => Linking.openURL(urls.faq)}
        alignedTop
      >
        <View style={styles.externalLinkContainer}>
          <ExternalLink size={16} color={colors.grey} />
        </View>
      </SettingsRow>
    );
  }
}

const styles = StyleSheet.create({
  externalLinkContainer: { marginRight: 10 },
});

export default LedgerSupportRow;
