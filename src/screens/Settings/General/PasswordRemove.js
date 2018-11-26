/* @flow */
import React, { PureComponent } from "react";
import type { NavigationScreenProp } from "react-navigation";
import * as Keychain from "react-native-keychain";
import { connect } from "react-redux";
import { compose } from "redux";
import { translate } from "react-i18next";
import i18next from "i18next";
import { PasswordsDontMatchError } from "@ledgerhq/live-common/lib/errors";
import { disablePrivacy } from "../../../actions/settings";
import type { T } from "../../../types/common";
import PasswordForm from "./PasswordForm";

type Props = {
  t: T,
  disablePrivacy(): () => *,
  navigation: NavigationScreenProp<{}>,
};
type State = {
  error: ?Error,
  confirmPassword: string,
};

const mapDispatchToProps = {
  disablePrivacy,
};

class PasswordRemove extends PureComponent<Props, State> {
  static navigationOptions = {
    title: i18next.t("auth.confirmPassword.title"),
  };

  state = {
    error: null,
    confirmPassword: "",
  };

  onChange = (confirmPassword: string) => {
    this.setState({ confirmPassword, error: null });
  };

  async submit() {
    const { confirmPassword } = this.state;
    if (!confirmPassword) return;
    const { disablePrivacy, navigation } = this.props;
    try {
      const credentials = await Keychain.getGenericPassword();
      if (credentials) {
        if (credentials.password !== confirmPassword) {
          throw new PasswordsDontMatchError();
        }
        await Keychain.resetGenericPassword();
      }
      disablePrivacy();
      navigation.dangerouslyGetParent().goBack();
    } catch (error) {
      this.setState({ error, confirmPassword: "" });
    }
  }

  onSubmit = () => {
    this.submit();
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
)(PasswordRemove);
