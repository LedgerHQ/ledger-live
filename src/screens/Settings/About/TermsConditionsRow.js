/* @flow */
import React, { PureComponent } from "react";
import { Trans } from "react-i18next";
import { View, Linking, StyleSheet } from "react-native";
import SettingsRow from "../../../components/SettingsRow";
import colors from "../../../colors";
import { urls } from "../../../config/urls";
import ExternalLink from "../../../icons/ExternalLink";

class TermsConditionsRow extends PureComponent<*> {
  render() {
    return (
      <SettingsRow
        title={<Trans i18nKey="settings.about.termsConditions" />}
        desc={<Trans i18nKey="settings.about.termsConditionsDesc" />}
        onPress={() =>
          Linking.openURL(urls.terms).catch(err =>
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
  externalLinkContainer: { marginHorizontal: 10 },
});

export default TermsConditionsRow;
