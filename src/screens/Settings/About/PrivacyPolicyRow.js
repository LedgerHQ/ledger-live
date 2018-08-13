/* @flow */
import React, { PureComponent } from "react";
import { translate } from "react-i18next";
import { View, Linking } from "react-native";
import SettingsRow from "../../../components/SettingsRow";
import type { T } from "../../../types/common";
import colors from "../../../colors";
import { urls } from "../../../config/urls";
import ExternalLink from "../../../images/icons/ExternalLink";

class PrivacyPolicyRow extends PureComponent<{
  t: T,
}> {
  render() {
    const { t } = this.props;
    return (
      <SettingsRow
        title={t("common:settings.about.privacyPolicy")}
        desc={t("common:settings.about.privacyPolicyDesc")}
        onPress={() =>
          Linking.openURL(urls.privacyPolicy).catch(err =>
            console.error("An error occurred", err),
          )
        }
      >
        <View style={{ margin: 10 }}>
          <ExternalLink size={16} color={colors.grey} />
        </View>
      </SettingsRow>
    );
  }
}

export default translate()(PrivacyPolicyRow);
