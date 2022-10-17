import React, { PureComponent } from "react";
import { withTranslation } from "react-i18next";
import { ScreenName } from "../../../const";
import type { T } from "../../../types/common";
import PasswordForm from "./PasswordForm";

type Props = {
  t: T;
  navigation: any;
};
type State = {
  password: string;
};

class PasswordAdd extends PureComponent<Props, State> {
  state = {
    password: "",
  };
  onChange = (password: string) => {
    this.setState({
      password,
    });
  };
  onSubmit = () => {
    const { navigation } = this.props;
    const { password } = this.state;
    if (!password) return;
    navigation.navigate(ScreenName.ConfirmPassword, {
      password,
    });
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

export default withTranslation()(PasswordAdd);
