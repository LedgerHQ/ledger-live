/* @flow */
import React, { PureComponent } from "react";
import type { NavigationScreenProp } from "react-navigation";
import { translate } from "react-i18next";
import i18next from "i18next";
import type { T } from "../../../types/common";
import PasswordForm from "./PasswordForm";

type Props = {
  t: T,
  navigation: NavigationScreenProp<{ goBack: () => void }>,
};
type State = {
  password: string,
};

class PasswordAdd extends PureComponent<Props, State> {
  static navigationOptions = {
    title: i18next.t("auth.addPassword.title"),
  };

  state = {
    password: "",
  };

  onChange = (password: string) => {
    this.setState({ password });
  };

  onSubmit = () => {
    const { navigation } = this.props;
    const { password } = this.state;
    if (!password) return;
    navigation.navigate("ConfirmPassword", { password });
  };

  render() {
    const { t } = this.props;
    const { password } = this.state;
    return (
      <PasswordForm
        placeholder={t("auth.addPassword.placeholder")}
        onChange={this.onChange}
        onSubmit={this.onSubmit}
        value={password}
      />
    );
  }
}

export default translate()(PasswordAdd);
