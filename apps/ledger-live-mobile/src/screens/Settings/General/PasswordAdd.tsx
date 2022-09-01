import React, { PureComponent } from "react";
import { TFunction, withTranslation } from "react-i18next";
import { PasswordAddFlowNavigatorScreenProps } from "../../../components/RootNavigator/types/PasswordAddFlowNavigator";
import { ScreenName } from "../../../const";
import PasswordForm from "./PasswordForm";

type NavigationProps =
  PasswordAddFlowNavigatorScreenProps<ScreenName.PasswordAdd>;

type Props = {
  t: TFunction;
} & NavigationProps;
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

const m: React.ComponentType<NavigationProps> = withTranslation()(PasswordAdd);

export default m;
