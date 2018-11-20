/* @flow */
import React, { PureComponent } from "react";
import { ScrollView, View, StyleSheet, SafeAreaView } from "react-native";
import type { NavigationScreenProp } from "react-navigation";
import * as Keychain from "react-native-keychain";
import { connect } from "react-redux";
import { compose } from "redux";
import { translate } from "react-i18next";
import i18next from "i18next";
import { PasswordsDontMatchError } from "@ledgerhq/live-common/lib/errors";
import { setPrivacy } from "../../../actions/settings";
import type { Privacy } from "../../../reducers/settings";
import type { T } from "../../../types/common";
import Button from "../../../components/Button";
import LText from "../../../components/LText";
import KeyboardView from "../../../components/KeyboardView";
import TranslatedError from "../../../components/TranslatedError";
import PasswordInput from "../../../components/PasswordInput";
import colors from "../../../colors";

type Props = {
  t: T,
  setPrivacy: ($Shape<Privacy>) => void,
  navigation: NavigationScreenProp<{ goBack: () => void }>,
};
type State = {
  password: string,
  confirmPassword: string,
  passwordError: ?Error,
  biometricsType?: string,
  secureTextEntry: boolean,
};

const mapDispatchToProps = {
  setPrivacy,
};

class ConfirmPassword extends PureComponent<Props, State> {
  static navigationOptions = {
    title: i18next.t("auth.confirmPassword.title"),
  };

  componentDidMount() {
    Keychain.getSupportedBiometryType().then(biometricsType => {
      this.setState({ biometricsType });
    });
  }

  constructor({ navigation }) {
    super();
    const password = navigation.getParam("password");
    this.state = {
      password,
      confirmPassword: "",
      passwordError: null,
      secureTextEntry: true,
    };
  }

  onChange = (confirmPassword: string) => {
    this.setState({ confirmPassword, passwordError: null });
  };
  async save() {
    const { password, biometricsType } = this.state;
    const { setPrivacy, navigation } = this.props;
    try {
      await Keychain.setGenericPassword("ledger", password);
      setPrivacy({
        value: password,
        authSecurityEnabled: true,
        biometricsType,
      });
      // TODO: implement dynamic navigation so it works for the Onboarding too.
      navigation.navigate("GeneralSettings");
    } catch (err) {
      console.log("could not save credentials"); // eslint-disable-line
    }
  }
  toggleSecureTextEntry = () => {
    const { secureTextEntry } = this.state;
    this.setState({ secureTextEntry: !secureTextEntry });
  };
  onSubmit = () => {
    if (this.state.password === this.state.confirmPassword) {
      this.save();
    } else {
      this.setState({
        passwordError: new PasswordsDontMatchError(),
      });
    }
  };
  render() {
    const { t } = this.props;
    const { passwordError, secureTextEntry } = this.state;
    return (
      <SafeAreaView style={styles.root}>
        <KeyboardView>
          <PasswordInput
            autoFocus
            error={passwordError}
            onChange={this.onChange}
            onSubmit={this.onSubmit}
            toggleSecureTextEntry={this.toggleSecureTextEntry}
            secureTextEntry={secureTextEntry}
            placeholder={t("auth.confirmPassword.placeholder")}
          />
          {passwordError && (
            <LText style={styles.errorStyle}>
              <TranslatedError error={passwordError} />
            </LText>
          )}
          <View style={styles.flex}>
            <Button
              title={t("common.confirm")}
              type="primary"
              onPress={this.onSubmit}
              containerStyle={[styles.buttonContainer]}
              titleStyle={[styles.buttonTitle]}
              secureTextEntry={secureTextEntry}
              disabled={!!passwordError}
            />
          </View>
        </KeyboardView>
      </SafeAreaView>
    );
  }
}

export default compose(
  connect(
    null,
    mapDispatchToProps,
  ),
  translate(),
)(ConfirmPassword);

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  textInputAS: {
    fontSize: 20,
    marginHorizontal: 16,
    paddingVertical: 24,
  },
  textContainer: {
    margin: 16,
  },
  textStyle: {
    fontSize: 16,
    marginBottom: 8,
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
  errorStyle: {
    color: colors.alert,
    marginHorizontal: 16,
    fontSize: 12,
  },
  wwww: {
    color: colors.live,
  },
  iconInput: {
    justifyContent: "center",
    marginRight: 16,
  },
});
