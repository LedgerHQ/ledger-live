/* @flow */
import React, { Component } from "react";
import { createStructuredSelector } from "reselect";
import { Switch } from "react-native";
import { connect } from "react-redux";
import { saveSettings } from "../../actions/settings";
import { authSecurityEnabledSelector } from "../../reducers/settings";

const mapStateToProps = createStructuredSelector({
  authSecurityEnabled: authSecurityEnabledSelector
});

const mapDispatchToProps = {
  saveSettings
};

class AuthSecurityToggle extends Component<*> {
  onValueChange = (authSecurityEnabled: boolean) => {
    this.props.saveSettings({ authSecurityEnabled });
    // TODO maybe we want to confirm with a popup & reboot
  };

  render() {
    const { authSecurityEnabled } = this.props;
    return (
      <Switch value={authSecurityEnabled} onValueChange={this.onValueChange} />
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(AuthSecurityToggle);
