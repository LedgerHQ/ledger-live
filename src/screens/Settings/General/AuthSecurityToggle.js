/* @flow */
import React, { Component } from "react";
import { createStructuredSelector } from "reselect";
import { Switch, Alert } from "react-native";
import { connect } from "react-redux";
import { Trans } from "react-i18next";
import { setAuthSecurity } from "../../../actions/settings";
import { authSecurityEnabledSelector } from "../../../reducers/settings";
import auth from "../../../context/AuthPass/auth";
import SettingsRow from "../../../components/SettingsRow";

type Props = {
  authSecurityEnabled: boolean,
  setAuthSecurity: boolean => void,
};
type State = {
  validationPending: boolean,
};

const mapStateToProps = createStructuredSelector({
  authSecurityEnabled: authSecurityEnabledSelector,
});

const mapDispatchToProps = {
  setAuthSecurity,
};

class AuthSecurityToggle extends Component<Props, State> {
  state = {
    validationPending: false,
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
            error || "",
          )}`,
        );
        return;
      }
    }
    this.props.setAuthSecurity(authSecurityEnabled);
  };

  render() {
    const { authSecurityEnabled } = this.props;
    const { validationPending } = this.state;
    return (
      <SettingsRow
        title={<Trans i18nKey="common:settings.display.password" />}
        desc={<Trans i18nKey="common:settings.display.passwordDesc" />}
        alignedTop
      >
        <Switch
          value={authSecurityEnabled || validationPending}
          onValueChange={this.onValueChange}
        />
      </SettingsRow>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(AuthSecurityToggle);
