/* @flow */
import React, { PureComponent } from "react";
import { connect } from "react-redux";
import { compose } from "redux";
import { translate } from "react-i18next";
import { createStructuredSelector } from "reselect";
import type { NavigationScreenProp } from "react-navigation";
import SettingsRow from "../../../components/SettingsRow";
import type { T } from "../../../types/common";

const mapStateToProps = createStructuredSelector({});

class ClearCacheRow extends PureComponent<{
  navigation: NavigationScreenProp<*>,
  t: T,
}> {
  static navigationOptions = {
    title: "Clear Cache",
  };

  render() {
    const { t } = this.props;
    return (
      <SettingsRow
        title={t("common:settings.help.clearCache")}
        desc={t("common:settings.help.clearCacheDesc")}
        arrowRight
        onPress={() => console.log("trying to clear cache!")}
      />
    );
  }
}

export default compose(
  connect(mapStateToProps),
  translate(),
)(ClearCacheRow);
