/* @flow */
import React, { PureComponent } from "react";
import { translate } from "react-i18next";
import { View, Linking, StyleSheet } from "react-native";
import colors from "../../../colors";
import { urls } from "../../../config/urls";
import SettingsRow from "../../../components/SettingsRow";
import type { T } from "../../../types/common";
import ExternalLink from "../../../icons/ExternalLink";

class LedgerSupportRow extends PureComponent<{
  t: T,
}> {
  render() {
    const { t } = this.props;
    return (
      <SettingsRow
        title={t("settings.help.support")}
        desc={t("settings.help.supportDesc")}
        onPress={() =>
          Linking.openURL(urls.faq).catch(err =>
            console.error("An error occurred", err),
          )
        }
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

export default translate()(LedgerSupportRow);
