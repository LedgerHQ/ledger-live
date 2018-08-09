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

class ExportLogsRow extends PureComponent<{
  navigation: NavigationScreenProp<*>,
  t: T,
}> {
  static navigationOptions = {
    title: "Export Logs",
  };

  render() {
    const { t } = this.props;
    return (
      <SettingsRow
        title={t("common:settings.help.exportLogs")}
        desc={t("common:settings.help.exportLogsDesc")}
        arrowRight
        onPress={() => console.log("trying to export logs!")}
      />
    );
  }
}

export default compose(
  connect(mapStateToProps),
  translate(),
)(ExportLogsRow);
