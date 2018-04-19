/* @flow */
import React, { Component } from "react";
import { createStructuredSelector } from "reselect";
import { Switch, Alert } from "react-native";
import { connect } from "react-redux";
import { saveSettings } from "../../actions/settings";
import { authSecurityEnabledSelector } from "../../reducers/settings";
import auth from "../../context/AuthPass/auth";

const mapStateToProps = createStructuredSelector({
  authSecurityEnabled: authSecurityEnabledSelector
});

const mapDispatchToProps = {
  saveSettings
};

class AuthSecurityToggle extends Component<*, { validationPending: boolean }> {
  state = {
    validationPending: false
  };
  onValueChange = async (authSecurityEnabled: boolean) => {
    if (authSecurityEnabled) {
      this.setState({ validationPending: true });
      let success = false;
      let error;
      try {
        success = await auth("Please authenticate to enable Auth Security");
      } catch (e) {
        error = e;
      }
      this.setState({ validationPending: false });
      if (!success) {
        Alert.alert(
          "Authentication failed",
          `Auth Security was not enabled because your phone failed to authenticate.\n${String(
            error || ""
          )}`
        );
        return;
      }
    }
    this.props.saveSettings({ authSecurityEnabled });
  };

  render() {
    const { authSecurityEnabled } = this.props;
    const { validationPending } = this.state;
    return (
      <Switch
        value={authSecurityEnabled || validationPending}
        onValueChange={this.onValueChange}
      />
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(AuthSecurityToggle);
