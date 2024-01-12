import React, { PureComponent } from "react";
import i18next from "i18next";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { connect } from "react-redux";
import { Trans } from "react-i18next";
import { compose } from "redux";
import { Box } from "@ledgerhq/native-ui";
import { Account } from "@ledgerhq/types-live";
import { accountScreenSelector } from "~/reducers/accounts";
import { updateAccount } from "~/actions/accounts";
import TextInput from "~/components/TextInput";
import { getFontStyle } from "~/components/LText";
import { Theme, withTheme } from "../../colors";
import Button from "~/components/wrappedUi/Button";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { AddAccountsNavigatorParamList } from "~/components/RootNavigator/types/AddAccountsNavigator";
import { State } from "~/reducers/types";
import { AccountSettingsNavigatorParamList } from "~/components/RootNavigator/types/AccountSettingsNavigator";

export const MAX_ACCOUNT_NAME_LENGHT = 50;

type NavigationProps =
  | StackNavigatorProps<AddAccountsNavigatorParamList, ScreenName.EditAccountName>
  | StackNavigatorProps<AccountSettingsNavigatorParamList, ScreenName.EditAccountName>;

type Props = {
  updateAccount: typeof updateAccount;
  colors: Theme["colors"];
  account: Account;
} & NavigationProps;

const mapStateToProps = (state: State, { route }: NavigationProps) =>
  accountScreenSelector(route)(state);

const mapDispatchToProps = {
  updateAccount,
};

class EditAccountName extends PureComponent<
  Props,
  {
    accountName: string;
  }
> {
  state = {
    accountName: "",
  };

  onChangeText = (accountName: string) => {
    this.setState({ accountName });
  };

  onNameEndEditing = () => {
    const { updateAccount, account, navigation } = this.props;
    const { accountName } = this.state;
    const { onAccountNameChange, account: accountFromAdd } = this.props.route.params || {};

    const isImportingAccounts = !!accountFromAdd;
    const cleanAccountName = accountName.trim();

    if (cleanAccountName.length) {
      if (isImportingAccounts) {
        onAccountNameChange && onAccountNameChange(cleanAccountName, accountFromAdd);
      } else {
        updateAccount({
          ...account,
          name: cleanAccountName,
        });
      }
      navigation.goBack();
    }
  };

  render() {
    const { account, colors } = this.props;
    const { accountName } = this.state;
    const { account: accountFromAdd } = this.props.route.params || {};

    const initialAccountName = account ? account.name : accountFromAdd?.name;

    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <Box px={6} flex={1}>
          <TextInput
            autoFocus
            value={accountName}
            defaultValue={initialAccountName}
            returnKeyType="done"
            maxLength={MAX_ACCOUNT_NAME_LENGHT}
            onChangeText={accountName => this.setState({ accountName })}
            onSubmitEditing={this.onNameEndEditing}
            clearButtonMode="while-editing"
            placeholder={i18next.t("account.settings.accountName.placeholder")}
          />
        </Box>
        <Button
          event="EditAccountNameApply"
          type="main"
          onPress={this.onNameEndEditing}
          disabled={!accountName.trim().length}
          m={6}
        >
          <Trans i18nKey="common.apply" />
        </Button>
      </SafeAreaView>
    );
  }
}

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  withTheme,
)(EditAccountName) as React.ComponentType<object>;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  body: {
    flexDirection: "column",
    flex: 1,
  },
  textInputAS: {
    padding: 16,
    fontSize: 20,
    ...getFontStyle({ semiBold: true }),
  },
  buttonContainer: {
    marginHorizontal: 16,
  },
  flex: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "flex-end",
    paddingBottom: 16,
  },
});
