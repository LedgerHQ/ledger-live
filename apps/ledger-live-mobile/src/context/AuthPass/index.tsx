import React, { PureComponent } from "react";
import { StyleSheet, View, AppState, Platform } from "react-native";
import * as Keychain from "react-native-keychain";
import type { TFunction } from "i18next";
import { connect } from "react-redux";
import { withTranslation } from "react-i18next";
import { createStructuredSelector } from "reselect";
import { compose } from "redux";
import { setPrivacy } from "~/actions/settings";
import { privacySelector } from "~/reducers/settings";
import { isPasswordLockBlocked } from "~/reducers/appstate";
import { SkipLockContext } from "~/components/behaviour/SkipLock";
import type { Privacy, State as GlobalState, AppState as EventState } from "~/reducers/types";
import AuthScreen from "./AuthScreen";
import RequestBiometricAuth from "~/components/RequestBiometricAuth";
import { resetQueuedDrawer } from "~/components/QueuedDrawer";

const mapDispatchToProps = {
  setPrivacy,
};

const mapStateToProps = createStructuredSelector<
  GlobalState,
  {
    privacy: Privacy | null | undefined;
    isPasswordLockBlocked: EventState["isPasswordLockBlocked"]; // skips screen lock for internal deeplinks from ptx web player.
  }
>({
  privacy: privacySelector,
  isPasswordLockBlocked: isPasswordLockBlocked,
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
  setPrivacy: (_: Privacy) => void;
  isPasswordLockBlocked: EventState["isPasswordLockBlocked"];
};

// as we needs to be resilient to reboots (not showing unlock again after a reboot)
// we need to store this global variable to know if we need to isLocked initially
let wasUnlocked = false;

// If "Password lock" setting is enabled, then this provider opens a re-authentication modal every time the user "backgrounds" or closes the app then re-focuses. Requires refactor.
class AuthPass extends PureComponent<Props, State> {
  setEnabled = (enabled: boolean) => {
    if (this.state.mounted)
      this.setState(prevState => ({
        skipLockCount: prevState.skipLockCount + (enabled ? 1 : -1),
      }));
  };
  state = {
    isLocked: !!this.props.privacy?.hasPassword && !wasUnlocked,
    biometricsError: null,
    appState: AppState.currentState || "",
    skipLockCount: 0,
    setEnabled: this.setEnabled,
    authModalOpen: false,
    mounted: false,
  };

  static getDerivedStateFromProps({ privacy }: Props, { isLocked }: State) {
    if (isLocked && !privacy?.hasPassword) {
      return {
        isLocked: false,
      };
    }

    return null;
  }

  componentDidMount() {
    // TODO: REWORK THIS COMPONENT WITHOUT USING STATE (eg: this.mounted instead)
    // eslint-disable-next-line react/no-direct-mutation-state
    this.state.mounted = true;
    this.auth();
    AppState.addEventListener("change", this.handleAppStateChange);

    // If privacy has never been set, set to the correct values
    if (!this.props.privacy) {
      Keychain.getSupportedBiometryType().then(biometricsType => {
        this.props.setPrivacy({
          hasPassword: false,
          biometricsType,
          biometricsEnabled: false,
        });
      });
    }
  }

  componentWillUnmount() {
    // eslint-disable-next-line react/no-direct-mutation-state
    this.state.mounted = false;
  }

  // The state lifecycle differs between iOS and Android. This is to prevent FaceId from triggering an inactive state and looping.
  isBackgrounded = (appState: string) => {
    const isAppInBackground =
      Platform.OS === "ios" ? appState === "background" : appState.match(/inactive|background/);

    return isAppInBackground;
  };

  // If the app reopened from the background, lock the app
  handleAppStateChange = (nextAppState: string) => {
    if (
      this.isBackgrounded(this.state.appState) &&
      nextAppState === "active" &&
      // do not lock if triggered by a deep link flow
      !this.props.isPasswordLockBlocked
    ) {
      this.lock();
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

    if (isLocked && privacy && privacy.biometricsEnabled && !authModalOpen && this.state.mounted) {
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
    if (!this.props.privacy?.hasPassword || this.state.skipLockCount) return;
    wasUnlocked = false;

    // Close the drawer if one was opened
    resetQueuedDrawer();

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

    if (isLocked && privacy?.hasPassword) {
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
        {children}
        {lockScreen}
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
  connect(mapStateToProps, mapDispatchToProps),
)(AuthPass);
