// @flow

import React, { PureComponent } from "react";
import { Linking, StyleSheet } from "react-native";
import { Trans } from "react-i18next";

import SettingsRow from "../../../components/SettingsRow";
import LText from "../../../components/LText";
import { urls } from "../../../config/urls";
import colors from "../../../colors";

class TermsOfUseRow extends PureComponent<{}> {
  termsLink = () => Linking.openURL(urls.terms);
  privacyPolicyLink = () => Linking.openURL(urls.privacyPolicy);

  render() {
    return (
      <SettingsRow
        event="TermsOfUseRow"
        title={<Trans i18nKey="settings.display.termsOfUse" />}
        desc={
          <Trans i18nKey="settings.display.termsOfUseDesc">
            {"text"}
            <LText onPress={this.termsLink} style={styles.link} semiBold>
              {"text"}
            </LText>
            {"text"}
            <LText
              onPress={this.privacyPolicyLink}
              style={styles.link}
              semiBold
            >
              {"text"}
            </LText>
            {"text"}
          </Trans>
        }
        {...this.props}
      />
    );
  }
}

const styles = StyleSheet.create({
  link: {
    color: colors.live,
  },
});

export default TermsOfUseRow;
