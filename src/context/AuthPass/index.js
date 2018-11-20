// @flow
import React, { PureComponent } from "react";
import { connect } from "react-redux";
import { translate } from "react-i18next";
import { compose } from "redux";
import { createStructuredSelector } from "reselect";
import {
  ScrollView,
  View,
  StyleSheet,
  SafeAreaView,
  AppState,
  Image,
  Animated,
} from "react-native";
import * as Keychain from "react-native-keychain";
import { PasswordIncorrectError } from "@ledgerhq/live-common/lib/errors";
import LText from "../../components/LText";
import TranslatedError from "../../components/TranslatedError";
import { privacySelector } from "../../reducers/settings";
import { isLockedSelector } from "../../reducers/application";
import { unlock, lock } from "../../actions/application";

import auth from "./auth";
import { withReboot } from "../Reboot";

import colors from "../../colors";
import Button from "../../components/Button";
import type { T } from "../../types/common";
import type { Privacy } from "../../reducers/settings";
import FailBiometrics from "./FailBiometrics";
import PoweredByLedger from "../../screens/Settings/PoweredByLedger";
import BottomModal from "../../components/BottomModal";
import HardResetModal from "../../components/HardResetModal";
import Touchable from "../../components/Touchable";
import PasswordInput from "../../components/PasswordInput";
import KeyboardView from "../../components/KeyboardView";

const mapStateToProps = createStructuredSelector({
  privacy: privacySelector,
  isLocked: isLockedSelector,
});

const mapDispatchToProps: Object = {
  unlock,
  lock,
};

type State = {
  passwordError: ?Error,
  biometricsError: ?Error,
  password: string,
  appState: ?string,
  isLocked: boolean,
  isModalOpened: boolean,
  secureTextEntry: boolean,
};

type Props = {
  privacy: Privacy,
  isLocked: boolean,
  children: State => *,
  unlock: () => void,
  lock: () => void,
  reboot: (?boolean) => *,
  t: T,
};

class AuthPass extends PureComponent<Props, State> {
  state = {
    passwordError: null,
    biometricsError: null,
    password: "",
    passwordFocused: false,
    appState: AppState.currentState,
    isLocked: this.props.isLocked,
    isModalOpened: false,
    secureTextEntry: true,
  };

  focusValue = new Animated.Value(0);

  componentDidMount() {
    AppState.addEventListener("change", this.handleAppStateChange);
  }

  componentWillUnmount() {
    AppState.removeEventListener("change", this.handleAppStateChange);
  }

  handleAppStateChange = nextAppState => {
    const { privacy, lock, unlock } = this.props;
    const { appState } = this.state;
    if (
      appState &&
      appState.match(/active/) &&
      nextAppState.match(/background/)
    ) {
      this.setState({ biometricsError: null });
      privacy.authSecurityEnabled && lock(); // eslint-disable-line
    } else if (
      appState &&
      appState.match(/background/) &&
      nextAppState === "active"
    ) {
      if (privacy.biometricsEnabled) {
        auth("Please authenticate to Ledger Live app")
          .then(() => {
            unlock();
          })
          .catch(error => {
            this.setState({ biometricsError: error });
          });
      }
    }
    this.setState({ appState: nextAppState });
  };

  onHardReset = () => this.props.reboot(true);

  async load() {
    const { unlock } = this.props;
    const { password } = this.state;
    try {
      const credentials = await Keychain.getGenericPassword();
      if (credentials && credentials.password === password) {
        this.setState({ biometricsError: null, password: "" });
        unlock();
      } else {
        credentials
          ? this.setState({ passwordError: new PasswordIncorrectError() })
          : console.log("no credentials stored"); // eslint-disable-line
      }
    } catch (err) {
      console.log("could not load credentials"); // eslint-disable-line
      this.setState({ passwordError: err });
    }
  }

  onSubmit = () => {
    if (this.state.password) {
      this.load();
    }
  };

  onChange = (password: string) => {
    this.setState({ password, passwordError: null });
  };

  onRequestClose = () => this.setState({ isModalOpened: false });

  onPress = () => this.setState({ isModalOpened: true });

  toggleSecureTextEntry = () => {
    const { secureTextEntry } = this.state;
    this.setState({ secureTextEntry: !secureTextEntry });
  };

  onFocus = () => {
    Animated.timing(this.focusValue, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  onBlur = () => {
    Animated.timing(this.focusValue, {
      toValue: 0,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  render() {
    const { children, isLocked, t, privacy } = this.props;
    const {
      passwordError,
      biometricsError,
      isModalOpened,
      secureTextEntry,
    } = this.state;
    if (isLocked) {
      // TODO put this in a component & split into subcomponents
      return (
        <SafeAreaView style={styles.root}>
          <KeyboardView>
            <View style={{ flex: 1 }} />
            <View style={styles.body}>
              <View>
                <View style={styles.logoCenter}>
                  {biometricsError ? (
                    <FailBiometrics privacy={privacy} />
                  ) : (
                    <View>
                      <View style={{ alignSelf: "center" }}>
                        <Image
                          source={require("../../images/logo_small.png")}
                        />
                      </View>
                      <View style={styles.textContainer}>
                        <LText semiBold secondary style={styles.title}>
                          {t("auth.unlock.title")}
                        </LText>
                        <LText style={styles.description}>
                          {t("auth.unlock.desc")}
                        </LText>
                      </View>
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.inputWrapper}>
                <PasswordInput
                  withBorder
                  error={passwordError}
                  onChange={this.onChange}
                  onSubmit={this.onSubmit}
                  toggleSecureTextEntry={this.toggleSecureTextEntry}
                  secureTextEntry={secureTextEntry}
                  placeholder={t("auth.unlock.inputPlaceholder")}
                  onFocus={this.onFocus}
                  onBlur={this.onBlur}
                />
              </View>
              {passwordError && (
                <LText style={styles.errorStyle}>
                  <TranslatedError error={passwordError} />
                </LText>
              )}
              <View>
                <Animated.View style={{ opacity: this.focusValue }}>
                  <Button
                    title={t("auth.unlock.login")}
                    type="primary"
                    onPress={this.onSubmit}
                    containerStyle={styles.buttonContainer}
                    titleStyle={styles.buttonTitle}
                    disabled={!!passwordError}
                  />
                </Animated.View>
                <Touchable style={styles.forgot} onPress={this.onPress}>
                  <LText style={styles.link}>
                    {t("auth.unlock.forgotPassword")}
                  </LText>
                </Touchable>
              </View>
            </View>
            <View style={{ flex: 1 }} />
          </KeyboardView>
          <View style={styles.footer}>
            <PoweredByLedger />
          </View>
          <BottomModal isOpened={isModalOpened} onClose={this.onRequestClose}>
            <HardResetModal
              onRequestClose={this.onRequestClose}
              onHardReset={this.onHardReset}
            />
          </BottomModal>
        </SafeAreaView>
      );
    }
    return children(this.state);
  }
}

export default compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  translate(),
)(withReboot(AuthPass));

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.lightGrey,
  },
  body: {},
  textContainer: {
    marginVertical: 8,
  },
  description: {
    color: colors.grey,
    textAlign: "center",
  },
  title: {
    fontSize: 16,
    textAlign: "center",
    marginVertical: 16,
  },
  errorStyle: {
    color: "red",
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  buttonContainer: {
    marginHorizontal: 16,
  },
  buttonTitle: {
    fontSize: 16,
  },
  inputWrapper: {
    marginHorizontal: 16,
  },
  footer: {
    paddingBottom: 16,
  },
  forgot: {
    position: "absolute",
    width: "100%",
    top: 0,
    zIndex: -1,
  },
  resetButtonBg: {
    marginTop: 8,
    backgroundColor: colors.alert,
  },
  resetButtonTitle: {
    color: colors.white,
  },
  logoCenter: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 32,
  },
  link: {
    color: colors.live,
    marginTop: 16,
    textAlign: "center",
  },
});
