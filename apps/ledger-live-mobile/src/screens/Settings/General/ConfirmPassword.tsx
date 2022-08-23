import React, { PureComponent } from "react";
import { Platform, Vibration } from "react-native";
import * as Keychain from "react-native-keychain";
import { connect } from "react-redux";
import { compose } from "redux";
import { withTranslation } from "react-i18next";
import { PasswordsDontMatchError } from "@ledgerhq/errors";

import { setPrivacy } from "../../../actions/settings";
import { Privacy } from "../../../reducers/settings";
import { T } from "../../../types/common";
import PasswordForm from "./PasswordForm";
import { VIBRATION_PATTERN_ERROR } from "../../../constants";

type Props = {
  t: T;
  setPrivacy: (privacy: Privacy) => void;
  navigation: any;
  route: any;
};

type State = {
  password: string;
  confirmPassword: string;
  error?: Error;
  biometricsType?: string;
};

const mapDispatchToProps = {
  setPrivacy,
};

class ConfirmPassword extends PureComponent<Props, State> {
  componentDidMount() {
    Keychain.getSupportedBiometryType().then(biometricsType => {
      if (biometricsType) this.setState({ biometricsType });
    });
  }

  constructor({ route }) {
    super();
    const password = route.params?.password;
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
    const options =
      Platform.OS === "ios"
        ? {}
        : {
            accessControl: Keychain.ACCESS_CONTROL.APPLICATION_PASSWORD,
            rules: Keychain.SECURITY_RULES.NONE,
          };
    try {
      await Keychain.setGenericPassword("ledger", password, options);
      setPrivacy({
        biometricsType,
        biometricsEnabled: false,
      });
      const n = navigation.getParent();
      if (n) n.goBack();
    } catch (err) {
      // eslint-disable-next-line no-console
      if (__DEV__) console.log("could not save credentials");
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
  // $FlowFixMe
  connect(null, mapDispatchToProps),
  withTranslation(),
)(ConfirmPassword);
