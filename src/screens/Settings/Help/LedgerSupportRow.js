/* @flow */
import React, { PureComponent } from "react";
import { connect } from "react-redux";
import { compose } from "redux";
import { translate } from "react-i18next";
import { View, Linking } from "react-native";
import { createStructuredSelector } from "reselect";
import type { NavigationScreenProp } from "react-navigation";
import colors from "../../../colors";
import { urls } from "../../../config/urls";
import SettingsRow from "../../../components/SettingsRow";
import type { T } from "../../../types/common";
import ExternalLink from "../../../images/icons/ExternalLink";

const mapStateToProps = createStructuredSelector({});

class LedgerSupportRow extends PureComponent<{
  navigation: NavigationScreenProp<*>,
  t: T,
}> {
  static navigationOptions = {
    title: "Ledger Support",
  };

  render() {
    const { t } = this.props;
    return (
      <SettingsRow
        title={t("common:settings.help.support")}
        desc={t("common:settings.help.supportDesc")}
        onPress={() =>
          Linking.openURL(urls.faq).catch(err =>
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

export default compose(
  connect(mapStateToProps),
  translate(),
)(LedgerSupportRow);
