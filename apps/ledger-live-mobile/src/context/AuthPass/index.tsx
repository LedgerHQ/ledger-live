import React, { PureComponent } from "react";
import { StyleSheet, View, AppState } from "react-native";
import type { TFunction } from "i18next";
import { connect } from "react-redux";
import { withTranslation } from "react-i18next";
import { createStructuredSelector } from "reselect";
import { compose } from "redux";
import { getEnv } from "@ledgerhq/live-common/env";
import { privacySelector } from "../../reducers/settings";
import { SkipLockContext } from "../../components/behaviour/SkipLock";
import { AUTOLOCK_TIMEOUT } from "../../constants";
import type { Privacy, State as GlobalState } from "../../reducers/types";
import AuthScreen from "./AuthScreen";
import RequestBiometricAuth from "../../components/RequestBiometricAuth";

const mapStateToProps = createStructuredSelector<
  GlobalState,
  { privacy: Privacy | null | undefined }
>({
  privacy: privacySelector,
});
type State = {
  isLocked: boolean;
  biometricsError: Error | null | undefined;
  appState: string;
  skipLockCount: number;
  setEnabled: (_: boolean) => void;
  authModalOpen: boolean;
  mounted: boolean;
};
type OwnProps = {
  children: JSX.Element;
};
type Props = OwnProps & {
  t: TFunction;
  privacy: Privacy | null | undefined;
};
// as we needs to be resilient to reboots (not showing unlock again after a reboot)
// we need to store this global variable to know if we need to isLocked initially
let wasUnlocked = false;

class AuthPass extends PureComponent<Props, State> {
  setEnabled = (enabled: boolean) => {
    if (this.state.mounted)
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
    mounted: false,
  };

  static getDerivedStateFromProps({ privacy }: Props, { isLocked }: State) {
    if (isLocked && !privacy) {
      return {
        isLocked: false,
      };
    }

    return null;
  }

  componentDidMount() {
    this.state.mounted = true;
    this.auth();
    AppState.addEventListener("change", this.handleAppStateChange);
  }

  componentWillUnmount() {
    this.state.mounted = false;
  }

  appInBg: number | undefined;
  handleAppStateChange = (nextAppState: string) => {
    if (
      this.state.appState.match(/inactive|background/) &&
      nextAppState === "active" &&
      !!this.appInBg &&
      this.appInBg + AUTOLOCK_TIMEOUT < Date.now()
    ) {
      this.lock();
      this.appInBg = Date.now();
    } else if (
      getEnv("MOCK") &&
      this.state.appState.match(/inactive|background/) &&
      nextAppState === "active" &&
      !!this.appInBg &&
      this.appInBg + 5000 < Date.now()
    ) {
      this.lock();
      this.appInBg = Date.now();
    } else if (
      nextAppState === "background" ||
      this.state.appState === "active"
    ) {
      this.appInBg = Date.now();
    }

    if (this.state.mounted)
      this.setState({
        appState: nextAppState,
      });
  };
  // auth: try to auth with biometrics and fallback on password
  auth = () => {
    const { privacy } = this.props;
    const { isLocked, authModalOpen } = this.state;

    if (
      isLocked &&
      privacy &&
      privacy.biometricsEnabled &&
      !authModalOpen &&
      this.state.mounted
    ) {
      this.setState({
        authModalOpen: true,
      });
    }
  };
  onSuccess = () => {
    if (this.state.mounted)
      this.setState({
        authModalOpen: false,
      });
    this.unlock();
  };
  onError = (error: Error) => {
    if (this.state.mounted) {
      this.setState({
        authModalOpen: false,
      });
      this.setState({
        biometricsError: error,
      });
    }
  };
  // lock the app
  lock = () => {
    if (!this.props.privacy || this.state.skipLockCount) return;
    wasUnlocked = false;

    if (this.state.mounted) {
      this.setState(
        {
          isLocked: true,
          biometricsError: null,
        },
        () => this.auth(),
      );
    }
  };
  // unlock the app
  unlock = () => {
    wasUnlocked = true;

    if (this.state.mounted) {
      this.setState({
        isLocked: false,
        biometricsError: null,
      });
    }
  };

  render() {
    const { children, privacy } = this.props;
    const { isLocked, biometricsError, setEnabled, authModalOpen } = this.state;
    let lockScreen = null;

    if (isLocked && privacy) {
      lockScreen = (
        <View style={styles.container}>
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
        </View>
      );
    }

    return (
      <SkipLockContext.Provider value={setEnabled}>
        {lockScreen}
        {children}
      </SkipLockContext.Provider>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    zIndex: 10,
  },
});

export default compose<React.ComponentType<OwnProps>>(
  withTranslation(),
  connect(mapStateToProps),
)(AuthPass);
