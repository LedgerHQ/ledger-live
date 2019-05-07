/* @flow */
import React, { PureComponent } from "react";
import type { NavigationScreenProp } from "react-navigation";
import * as Keychain from "react-native-keychain";
import { connect } from "react-redux";
import { compose } from "redux";
import { translate } from "react-i18next";
import i18next from "i18next";
import { PasswordsDontMatchError } from "@ledgerhq/errors";
import { Vibration } from "react-native";
import { setPrivacy } from "../../../actions/settings";
import type { Privacy } from "../../../reducers/settings";
import type { T } from "../../../types/common";
import PasswordForm from "./PasswordForm";
import { VIBRATION_PATTERN_ERROR } from "../../../constants";

type Props = {
  t: T,
  setPrivacy: Privacy => *,
  navigation: NavigationScreenProp<{}>,
};
type State = {
  password: string,
  confirmPassword: string,
  error: ?Error,
  biometricsType?: string,
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
      if (biometricsType) this.setState({ biometricsType });
    });
  }

  constructor({ navigation }) {
    super();
    const password = navigation.getParam("password");
    this.state = {
      password,
      confirmPassword: "",
      error: null,
    };
  }

  onChange = (confirmPassword: string) => {
    this.setState({ confirmPassword, error: null });
  };

  async save() {
    const { password, biometricsType } = this.state;
    const { setPrivacy, navigation } = this.props;
    try {
      await Keychain.setGenericPassword("ledger", password);
      setPrivacy({
        biometricsType,
        biometricsEnabled: false,
      });
      const n = navigation.dangerouslyGetParent();
      if (n) n.goBack();
    } catch (err) {
      console.log("could not save credentials"); // eslint-disable-line
    }
  }

  onSubmit = () => {
    if (!this.state.password) return;
    if (this.state.password === this.state.confirmPassword) {
      this.save();
    } else {
      Vibration.vibrate(VIBRATION_PATTERN_ERROR);
      this.setState({
        error: new PasswordsDontMatchError(),
        confirmPassword: "",
      });
    }
  };

  render() {
    const { t } = this.props;
    const { error, confirmPassword } = this.state;
    return (
      <PasswordForm
        placeholder={t("auth.confirmPassword.placeholder")}
        onChange={this.onChange}
        onSubmit={this.onSubmit}
        error={error}
        value={confirmPassword}
      />
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
