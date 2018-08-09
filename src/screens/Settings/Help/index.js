/* @flow */
import React, { PureComponent } from "react";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import type { NavigationScreenProp } from "react-navigation";
import { ScrollView } from "react-native";
import LedgerSupportRow from "./LedgerSupportRow";
import ClearCacheRow from "./ClearCacheRow";
import ExportLogsRow from "./ExportLogsRow";
import HardResetRow from "./HardResetRow";

const mapStateToProps = createStructuredSelector({});

class HelpSettings extends PureComponent<{
  navigation: NavigationScreenProp<*>,
}> {
  static navigationOptions = {
    title: "Help",
  };

  render() {
    const { navigation } = this.props;
    return (
      <ScrollView contentContainerStyle={{ paddingVertical: 10 }}>
        <LedgerSupportRow />
        <ClearCacheRow />
        <ExportLogsRow />
        <HardResetRow />
      </ScrollView>
    );
  }
}

export default connect(mapStateToProps)(HelpSettings);
