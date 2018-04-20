/* @flow */
import React, { Component } from "react";
import { Switch } from "react-native";
import { connect } from "react-redux";
import { saveSettings } from "../../actions/settings";
import type { State } from "../../reducers";

const mapStateToProps = (state: State) => ({
  settings: state.settings
});

const mapDispatchToProps = {
  saveSettings
};

class DeltaColorToggle extends Component<*> {
  setEasternColorLocale = (isEastern: boolean) => {
    const { saveSettings } = this.props;
    if (isEastern) {
      saveSettings({ deltaChangeColorLocale: "eastern" });
    } else {
      saveSettings({ deltaChangeColorLocale: "western" });
    }
  };

  render() {
    const { settings } = this.props;
    return (
      <Switch
        value={settings.deltaChangeColorLocale === "eastern"}
        onValueChange={this.setEasternColorLocale}
      />
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(DeltaColorToggle);
