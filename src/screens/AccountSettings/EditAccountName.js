/* @flow */
import React, { PureComponent } from "react";
import i18next from "i18next";
import { View, StyleSheet } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import type { Account } from "@ledgerhq/live-common/lib/types";
import { connect } from "react-redux";
import { Trans } from "react-i18next";
import { compose } from "redux";
import { accountScreenSelector } from "../../reducers/accounts";
import { updateAccount } from "../../actions/accounts";
import Button from "../../components/Button";
import TextInput from "../../components/TextInput";
import KeyboardView from "../../components/KeyboardView";
import { getFontStyle } from "../../components/LText";
import NavigationScrollView from "../../components/NavigationScrollView";
import { withTheme } from "../../colors";

export const MAX_ACCOUNT_NAME_LENGHT = 50;

const forceInset = { bottom: "always" };

type Props = {
  navigation: any,
  route: { params: RouteParams },
  updateAccount: Function,
  account: Account,
  colors: *,
};

type RouteParams = {
  account: any,
  accountId?: string,
  accountName?: string,
  onAccountNameChange: (name: string, changedAccount: Account) => void,
};

type State = {
  accountName: string,
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
    const {
      onAccountNameChange,
      account: accountFromAdd,
    } = this.props.route.params;

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
        <KeyboardView style={styles.body}>
          <NavigationScrollView
            contentContainerStyle={styles.root}
            keyboardShouldPersistTaps="handled"
          >
            <TextInput
              autoFocus
              style={[styles.textInputAS, { color: colors.darkBlue }]}
              defaultValue={initialAccountName}
              returnKeyType="done"
              maxLength={MAX_ACCOUNT_NAME_LENGHT}
              onChangeText={accountName => this.setState({ accountName })}
              onSubmitEditing={this.onNameEndEditing}
              clearButtonMode="while-editing"
              placeholder={i18next.t(
                "account.settings.accountName.placeholder",
              )}
            />
            <View style={styles.flex}>
              <Button
                event="EditAccountNameApply"
                type="primary"
                title={<Trans i18nKey="common.apply" />}
                onPress={this.onNameEndEditing}
                disabled={!accountName.trim().length}
                containerStyle={styles.buttonContainer}
              />
            </View>
          </NavigationScrollView>
        </KeyboardView>
      </SafeAreaView>
    );
  }
}

// $FlowFixMe
export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  withTheme,
)(EditAccountName);

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
