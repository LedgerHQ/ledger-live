// @flow
import React, { PureComponent } from "react";
import { AppState } from "react-native";
import { connect } from "react-redux";
import { translate } from "react-i18next";
import { createStructuredSelector } from "reselect";
import { privacySelector } from "../../reducers/settings";
import { AUTOLOCK_TIMEOUT } from "../../constants";

import auth from "./auth";
import type { Privacy } from "../../reducers/settings";
import AuthScreen from "./AuthScreen";

const mapStateToProps = createStructuredSelector({
  privacy: privacySelector,
});

type State = {
  isLocked: boolean,
  biometricsError: ?Error,
};

type Props = {
  t: *,
  privacy: Privacy,
  children: *,
};

class AuthPass extends PureComponent<Props, State> {
  state = {
    isLocked: this.props.privacy.authSecurityEnabled,
    biometricsError: null,
  };

  componentWillUnmount() {
    AppState.removeEventListener("change", this.handleAppStateChange);
  }

  componentDidMount() {
    this.auth();
    AppState.addEventListener("change", this.handleAppStateChange);
  }

  timeout: *;
  handleAppStateChange = appState => {
    clearTimeout(this.timeout);
    if (appState === "active") {
      this.auth();
    } else {
      this.timeout = setTimeout(() => {
        if (!this.state.isLocked) {
          this.lock();
        }
      }, AUTOLOCK_TIMEOUT);
    }
  };

  // auth: try to auth with biometrics and fallback on password
  authPending = false;
  auth = () => {
    const { privacy, t } = this.props;
    const { isLocked } = this.state;
    if (isLocked && privacy.biometricsEnabled) {
      if (this.authPending) return;
      this.authPending = true;
      auth(t("auth.unlock.biometricsTitle"))
        .then(() => {
          this.authPending = false;
          this.unlock();
        })
        .catch(error => {
          this.authPending = false;
          this.setState({
            biometricsError: error,
          });
        });
    }
  };

  // lock the app
  lock = () => {
    if (!this.props.privacy) return;
    this.setState({
      isLocked: true,
      biometricsError: null,
    });
  };

  // unlock the app
  unlock = () => {
    this.setState({
      isLocked: false,
      biometricsError: null,
    });
  };

  render() {
    const { children, privacy } = this.props;
    const { isLocked, biometricsError } = this.state;
    if (isLocked) {
      return (
        <AuthScreen
          biometricsError={biometricsError}
          privacy={privacy}
          unlock={this.unlock}
        />
      );
    }
    return children;
  }
}

export default translate()(connect(mapStateToProps)(AuthPass));
