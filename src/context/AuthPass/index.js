// @flow
import React, { PureComponent } from "react";
import { AppState } from "react-native";
import { connect } from "react-redux";
import { withTranslation } from "react-i18next";
import { createStructuredSelector } from "reselect";
import { privacySelector } from "../../reducers/settings";
import { SkipLockContext } from "../../components/behaviour/SkipLock";
import { AUTOLOCK_TIMEOUT } from "../../constants";
import type { Privacy } from "../../reducers/settings";
import AuthScreen from "./AuthScreen";
import RequestBiometricAuth from "../../components/RequestBiometricAuth";

const mapStateToProps = createStructuredSelector({
  privacy: privacySelector,
});

type State = {
  isLocked: boolean,
  biometricsError: ?Error,
  appState: string,
  skipLockCount: number,
  setEnabled: (enabled: boolean) => void,
  authModalOpen: boolean,
};

type Props = {
  t: *,
  privacy: ?Privacy,
  children: *,
};

// as we needs to be resilient to reboots (not showing unlock again after a reboot)
// we need to store this global variable to know if we need to isLocked initially
let wasUnlocked = false;

class AuthPass extends PureComponent<Props, State> {
  setEnabled = (enabled: boolean) => {
    this.setState(prevState => ({
      skipLockCount: prevState.skipLockCount + (enabled ? 1 : -1),
    }));
  };

  state = {
    isLocked: !!this.props.privacy && !wasUnlocked,
    biometricsError: null,
    appState: AppState.currentState || "",

    skipLockCount: 0,
    setEnabled: this.setEnabled,
    authModalOpen: false,
  };

  static getDerivedStateFromProps({ privacy }, { isLocked }) {
    if (isLocked && !privacy) {
      return { isLocked: false };
    }
    return null;
  }

  componentDidMount() {
    this.auth();
    AppState.addEventListener("change", this.handleAppStateChange);
  }

  appInBg: number;

  handleAppStateChange = nextAppState => {
    if (
      this.state.appState.match(/inactive|background/) &&
      nextAppState === "active" &&
      this.appInBg + AUTOLOCK_TIMEOUT < Date.now()
    ) {
      this.lock();
      this.appInBg = Date.now();
    } else if (
      nextAppState === "background" ||
      this.state.appState === "active"
    ) {
      this.appInBg = Date.now();
    }
    this.setState({ appState: nextAppState });
  };

  // auth: try to auth with biometrics and fallback on password
  auth = () => {
    const { privacy } = this.props;
    const { isLocked, authModalOpen } = this.state;
    if (isLocked && privacy && privacy.biometricsEnabled && !authModalOpen) {
      this.setState({ authModalOpen: true });
    }
  };

  onSuccess = () => {
    this.setState({ authModalOpen: false });
    this.unlock();
  };

  onError = error => {
    this.setState({ authModalOpen: false });
    this.setState({
      biometricsError: error,
    });
  };

  // lock the app
  lock = () => {
    if (!this.props.privacy || this.state.skipLockCount) return;

    wasUnlocked = false;
    this.setState(
      {
        isLocked: true,
        biometricsError: null,
      },
      () => this.auth(),
    );
  };

  // unlock the app
  unlock = () => {
    wasUnlocked = true;
    this.setState({
      isLocked: false,
      biometricsError: null,
    });
  };

  render() {
    const { children, privacy } = this.props;
    const { isLocked, biometricsError, setEnabled, authModalOpen } = this.state;
    if (isLocked && privacy) {
      return (
        <>
          <AuthScreen
            biometricsError={biometricsError}
            privacy={privacy}
            lock={this.lock}
            unlock={this.unlock}
          />
          <RequestBiometricAuth
            disabled={!authModalOpen}
            onSuccess={this.onSuccess}
            onError={this.onError}
          />
        </>
      );
    }
    return (
      <SkipLockContext.Provider value={setEnabled}>
        {children}
      </SkipLockContext.Provider>
    );
  }
}

export default withTranslation()(connect(mapStateToProps)(AuthPass));
