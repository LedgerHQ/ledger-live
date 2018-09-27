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
  TextInput,
  SafeAreaView,
  AppState,
} from "react-native";
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
    appState: AppState.currentState,
    isLocked: this.props.isLocked,
  };

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
            // TODO android error respects expected json, iOS doesn't. fix it
            this.setState({ biometricsError: error });
          });
      }
    }
    this.setState({ appState: nextAppState });
  };

  onHardReset = () => this.props.reboot(true);

  validatePassword = () => {
    const { privacy, unlock, t } = this.props;
    if (privacy.value === this.state.password) {
      this.setState({ biometricsError: null, password: "" });
      unlock();
    } else {
      this.setState({
        passwordError: new Error(t("errors.passwordError.title")),
      });
    }
  };

  onChangeText = (password: string) => {
    this.setState({ password });
  };

  cleanErrors = () => {
    this.setState({ passwordError: null });
  };

  render() {
    const { children, isLocked, t } = this.props;
    const { passwordError, biometricsError } = this.state;

    if (isLocked) {
      return (
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.root}>
            <View style={styles.body}>
              {biometricsError && (
                <View style={styles.biometricsErrorContainer}>
                  <LText semiBold style={styles.biometricsErrorMessage}>
                    <TranslatedError error={biometricsError} />
                  </LText>
                  <LText
                    style={[styles.biometricsErrorMessage, { fontSize: 12 }]}
                  >
                    <TranslatedError
                      error={biometricsError}
                      field="description"
                    />
                  </LText>
                </View>
              )}
              <View style={styles.textContainer}>
                <LText bold style={styles.textStyle}>
                  {t("auth.unlock.title")}
                </LText>
                <LText style={styles.textStyle}>{t("auth.unlock.desc")}</LText>
              </View>
              <TextInput
                autoFocus
                style={styles.textInputAS}
                placeholder={t("auth.unlock.inputPlaceholder")}
                returnKeyType="done"
                keyboardType="numeric"
                maxLength={7}
                onChangeText={this.onChangeText}
                onChange={this.cleanErrors}
                onSubmitEditing={this.validatePassword}
              />
              {passwordError && (
                <LText style={styles.errorStyle}>
                  <TranslatedError error={passwordError} />
                </LText>
              )}
            </View>
            <View style={styles.flex}>
              <Button
                title={t("common.apply")}
                type="primary"
                onPress={this.validatePassword}
                containerStyle={[styles.buttonContainer]}
                titleStyle={[styles.buttonTitle]}
              />
              <Button
                title={t("reset.button")}
                type="alert"
                onPress={this.onHardReset}
                containerStyle={[styles.buttonContainer, styles.resetButtonBg]}
                titleStyle={[styles.buttonTitle, styles.resetButtonTitle]}
              />
            </View>
          </ScrollView>
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
  },
  body: {
    margin: 16,
  },
  textContainer: {
    marginBottom: 16,
  },
  textStyle: {
    fontSize: 16,
    marginBottom: 8,
  },
  errorStyle: {
    color: "red",
  },
  textInputAS: {
    fontSize: 16,
  },
  biometricsErrorContainer: {
    backgroundColor: colors.lightAlert,
    height: 48,
    justifyContent: "center",
    marginBottom: 16,
  },
  biometricsErrorMessage: {
    color: colors.live,
    paddingLeft: 8,
  },
  buttonContainer: {
    marginHorizontal: 16,
  },
  buttonTitle: {
    fontSize: 16,
  },
  flex: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "flex-end",
    paddingBottom: 16,
  },
  resetButtonBg: {
    marginTop: 8,
    backgroundColor: colors.alert,
  },
  resetButtonTitle: {
    color: colors.white,
  },
});
