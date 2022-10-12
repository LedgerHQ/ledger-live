import React, { PureComponent } from "react";
import i18next from "i18next";
import { StyleSheet } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import { Account } from "@ledgerhq/types-live";
import { connect } from "react-redux";
import { Trans } from "react-i18next";
import { compose } from "redux";
import { Box } from "@ledgerhq/native-ui";
import { accountScreenSelector } from "../../reducers/accounts";
import { updateAccount } from "../../actions/accounts";
import TextInput from "../../components/TextInput";
import { getFontStyle } from "../../components/LText";
import { withTheme } from "../../colors";
import Button from "../../components/wrappedUi/Button";

export const MAX_ACCOUNT_NAME_LENGHT = 50;

const forceInset = { bottom: "always" };

type Props = {
  navigation: any;
  route: { params: RouteParams };
  // eslint-disable-next-line @typescript-eslint/ban-types
  updateAccount: Function;
  account: Account;
  colors: any;
};

type RouteParams = {
  account: any;
  accountId?: string;
  accountName?: string;
  onAccountNameChange: (name: string, changedAccount: Account) => void;
};

type State = {
  accountName: string;
};

const mapStateToProps = (state, { route }) =>
  accountScreenSelector(route)(state);

const mapDispatchToProps = {
  updateAccount,
};

class EditAccountName extends PureComponent<Props, State> {
  state = {
    accountName: "",
  };

  onChangeText = (accountName: string) => {
    this.setState({ accountName });
  };

  onNameEndEditing = () => {
    const { updateAccount, account, navigation } = this.props;
    const { accountName } = this.state;
    const { onAccountNameChange, account: accountFromAdd } =
      this.props.route.params;

    const isImportingAccounts = !!accountFromAdd;
    const cleanAccountName = accountName.trim();

    if (cleanAccountName.length) {
      if (isImportingAccounts) {
        onAccountNameChange(cleanAccountName, accountFromAdd);
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
    const { account: accountFromAdd } = this.props.route.params;

    const initialAccountName = account ? account.name : accountFromAdd.name;

    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: colors.background }]}
        forceInset={forceInset}
      >
        <Box px={6} flex={1}>
          <TextInput
            autoFocus
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

// eslint-disable-next-line @typescript-eslint/ban-types
const m: React.ComponentType<{}> = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withTheme,
)(EditAccountName);

export default m;

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
