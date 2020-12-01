// @flow
import React, { PureComponent } from "react";
import { withTranslation, Trans } from "react-i18next";
import {
  TouchableWithoutFeedback,
  View,
  StyleSheet,
  Image,
  Vibration,
  Platform,
} from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import * as Keychain from "react-native-keychain";
import { PasswordIncorrectError } from "@ledgerhq/errors";
import type { T } from "../../types/common";
import type { Privacy } from "../../reducers/settings";
import { withReboot } from "../Reboot";
import colors from "../../colors";
import LText from "../../components/LText";
import TranslatedError from "../../components/TranslatedError";
import Button from "../../components/Button";
import PoweredByLedger from "../../screens/Settings/PoweredByLedger";
import BottomModal from "../../components/BottomModal";
import HardResetModal from "../../components/HardResetModal";
import Touchable from "../../components/Touchable";
import PasswordInput from "../../components/PasswordInput";
import KeyboardView from "../../components/KeyboardView";
import FailBiometrics from "./FailBiometrics";
import KeyboardBackgroundDismiss from "../../components/KeyboardBackgroundDismiss";
import { VIBRATION_PATTERN_ERROR } from "../../constants";

const forceInset = { bottom: "always" };

type State = {
  passwordError: ?Error,
  password: string,
  passwordFocused: boolean,
  isModalOpened: boolean,
  secureTextEntry: boolean,
};

type Props = {
  privacy: Privacy,
  unlock: () => void,
  lock: () => void,
  biometricsError: ?Error,
  reboot: (?boolean) => *,
  t: T,
};

class NormalHeader extends PureComponent<{}> {
  render() {
    return (
      <View>
        <Image
          style={styles.logo}
          source={require("../../images/logo_small.png")}
        />
        <LText semiBold secondary style={styles.title}>
          <Trans i18nKey="auth.unlock.title" />
        </LText>
        <LText style={styles.description}>
          <Trans i18nKey="auth.unlock.desc" />
        </LText>
      </View>
    );
  }
}

class FormFooter extends PureComponent<*> {
  render() {
    const {
      inputFocused,
      passwordEmpty,
      onSubmit,
      passwordError,
      onPress,
    } = this.props;
    return inputFocused ? (
      <TouchableWithoutFeedback>
        <Button
          event="SubmitUnlock"
          title={<Trans i18nKey="auth.unlock.login" />}
          type="primary"
          onPress={onSubmit}
          containerStyle={styles.buttonContainer}
          titleStyle={styles.buttonTitle}
          disabled={passwordError || passwordEmpty}
        />
      </TouchableWithoutFeedback>
    ) : (
      <Touchable event="ForgetPassword" style={styles.forgot} onPress={onPress}>
        <LText semiBold style={styles.link}>
          <Trans i18nKey="auth.unlock.forgotPassword" />
        </LText>
      </Touchable>
    );
  }
}

class AuthScreen extends PureComponent<Props, State> {
  state = {
    passwordError: null,
    password: "",
    passwordFocused: false,
    isModalOpened: false,
    secureTextEntry: true,
  };

  onHardReset = () => {
    this.props.reboot(true);
  };

  unlock = () => {
    this.setState({
      passwordError: null,
      password: "",
      passwordFocused: false,
      isModalOpened: false,
    });
  };

  submitId = 0;
  submit = async () => {
    const id = ++this.submitId;
    const { password } = this.state;
    const { unlock } = this.props;
    if (!password) return;
    try {
      const options =
        Platform.OS === "ios"
          ? {}
          : {
              accessControl: Keychain.ACCESS_CONTROL.APPLICATION_PASSWORD,
              rules: Keychain.SECURITY_RULES.NONE,
            };

      const credentials = await Keychain.getGenericPassword(options);
      if (id !== this.submitId) return;
      if (credentials && credentials.password === password) {
        unlock();
      } else if (credentials) {
        Vibration.vibrate(VIBRATION_PATTERN_ERROR);
        this.setState({
          passwordError: new PasswordIncorrectError(),
          password: "",
        });
      } else {
        console.log("no credentials stored"); // eslint-disable-line no-console
      }
    } catch (err) {
      if (id !== this.submitId) return;
      console.log("could not load credentials"); // eslint-disable-line no-console
      this.setState({ passwordError: err, password: "" });
    }
  };

  onSubmit = () => {
    this.submit();
  };

  onChange = (password: string) => {
    this.setState({ password, passwordError: null });
  };

  onRequestClose = () => {
    this.setState({ isModalOpened: false });
  };

  onPress = () => {
    this.setState({ isModalOpened: true });
  };

  toggleSecureTextEntry = () => {
    const { secureTextEntry } = this.state;
    this.setState({ secureTextEntry: !secureTextEntry });
  };

  onFocus = () => {
    this.setState({ passwordFocused: true });
  };

  onBlur = () => {
    this.setState({ passwordFocused: false });
  };

  render() {
    const { t, privacy, biometricsError, lock } = this.props;
    const {
      passwordError,
      isModalOpened,
      secureTextEntry,
      passwordFocused,
    } = this.state;
    return (
      <KeyboardBackgroundDismiss>
        <SafeAreaView style={styles.root} forceInset={forceInset}>
          <KeyboardView>
            <View style={{ flex: 1 }} />

            <View style={styles.body}>
              <View style={styles.header}>
                {biometricsError ? (
                  <FailBiometrics lock={lock} privacy={privacy} />
                ) : (
                  <NormalHeader />
                )}
              </View>

              <View style={styles.inputWrapper}>
                <PasswordInput
                  error={passwordError}
                  onChange={this.onChange}
                  onSubmit={this.onSubmit}
                  toggleSecureTextEntry={this.toggleSecureTextEntry}
                  secureTextEntry={secureTextEntry}
                  placeholder={t("auth.unlock.inputPlaceholder")}
                  onFocus={this.onFocus}
                  onBlur={this.onBlur}
                  password={this.state.password}
                />
              </View>

              {passwordError && (
                <LText style={styles.errorStyle}>
                  <TranslatedError error={passwordError} />
                </LText>
              )}

              <FormFooter
                inputFocused={passwordFocused}
                onSubmit={this.onSubmit}
                passwordError={passwordError}
                passwordEmpty={!this.state.password}
                onPress={this.onPress}
              />
            </View>

            <View style={{ flex: 1 }} />
          </KeyboardView>
          {!passwordFocused && (
            <View style={styles.footer} pointerEvents="none">
              <PoweredByLedger />
            </View>
          )}
          <BottomModal isOpened={isModalOpened} onClose={this.onRequestClose}>
            <HardResetModal
              onRequestClose={this.onRequestClose}
              onHardReset={this.onHardReset}
            />
          </BottomModal>
        </SafeAreaView>
      </KeyboardBackgroundDismiss>
    );
  }
}

export default withTranslation()(withReboot(AuthScreen));

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.lightGrey,
  },
  body: {},
  header: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 32,
    marginBottom: 24,
  },
  logo: {
    alignSelf: "center",
  },
  title: {
    fontSize: 20,
    textAlign: "center",
    marginVertical: 16,
    color: colors.darkBlue,
  },
  description: {
    color: colors.grey,
    textAlign: "center",
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
  forgot: {},
  resetButtonBg: {
    marginTop: 8,
    backgroundColor: colors.alert,
  },
  resetButtonTitle: {
    color: colors.white,
  },
  link: {
    color: colors.live,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 16,
    textAlign: "center",
  },
});
