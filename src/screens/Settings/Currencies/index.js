/* @flow */
import React, { PureComponent } from "react";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import type { NavigationScreenProp } from "react-navigation";
import SettingsRow from "../../../components/SettingsRow";

const mapStateToProps = createStructuredSelector({});

class CurrenciesSettings extends PureComponent<{
  navigation: NavigationScreenProp<*>,
}> {
  static navigationOptions = {
    title: "Currencies",
  };

  render() {
    // const { navigation } = this.props;
    return <SettingsRow title="PLACEHOLDER" />;
  }
}

export default connect(mapStateToProps)(CurrenciesSettings);
