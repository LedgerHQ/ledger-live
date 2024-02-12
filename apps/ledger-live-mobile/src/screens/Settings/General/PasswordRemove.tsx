import React, { PureComponent } from "react";
import * as Keychain from "react-native-keychain";
import { connect } from "react-redux";
import { compose } from "redux";
import { TFunction, withTranslation } from "react-i18next";
import { PasswordsDontMatchError } from "@ledgerhq/errors";
import { Vibration } from "react-native";
import { disablePrivacy } from "~/actions/settings";
import PasswordForm from "./PasswordForm";
import { VIBRATION_PATTERN_ERROR } from "~/utils/constants";
import { ScreenName } from "~/const";
import type { PasswordModifyFlowParamList } from "~/components/RootNavigator/types/PasswordModifyFlowNavigator";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";

type NavigationProps = StackNavigatorProps<PasswordModifyFlowParamList, ScreenName.PasswordRemove>;

type Props = {
  t: TFunction;
  disablePrivacy: () => void;
} & NavigationProps;

type State = {
  error?: Error | null;
  confirmPassword: string;
};

const mapDispatchToProps = {
  disablePrivacy,
};

class PasswordRemove extends PureComponent<Props, State> {
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
          Vibration.vibrate(VIBRATION_PATTERN_ERROR);
          throw new PasswordsDontMatchError();
        }
        await Keychain.resetGenericPassword();
      }
      disablePrivacy();
      const n = navigation.getParent();
      if (n) n.goBack();
    } catch (error) {
      this.setState({ error: error as Error, confirmPassword: "" });
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

export default compose<React.ComponentType<NavigationProps>>(
  connect(null, mapDispatchToProps),
  withTranslation(),
)(PasswordRemove);
