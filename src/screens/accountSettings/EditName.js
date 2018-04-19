/* @flow */
import React, { Component } from "react";
import { connect } from "react-redux";
import { StyleSheet, TextInput } from "react-native";
import type { NavigationScreenProp } from "react-navigation";
import type { Account } from "@ledgerhq/wallet-common/lib/types";
import SettingsRow from "../../components/SettingsRow";
import { updateAccount } from "../../actions/accounts";
import { getAccountById } from "../../reducers/accounts";
import type { State } from "../../reducers";

const mapStateToProps = (
  state: State,
  {
    navigation
  }: {
    navigation: NavigationScreenProp<{
      params: {
        accountId: string
      }
    }>
  }
) => {
  const { accountId } = navigation.state.params;
  const account = getAccountById(state, accountId);
  if (!account) throw new Error(`no account ${accountId}`);
  return { account };
};

const mapDispatchToProps = {
  updateAccount
};

class EditName extends Component<{
  updateAccount: ($Shape<Account>) => *,
  account: Account,
  navigation: NavigationScreenProp<{
    params: {
      account: Account
    }
  }>
}> {
  static navigationOptions = {
    title: "Edit Name"
  };
  onNameEndEditing = (e: *) => {
    const { updateAccount, account, navigation } = this.props;
    if (e.nativeEvent.text.length) {
      updateAccount({
        name: e.nativeEvent.text,
        id: account.id
      });
    }
    navigation.goBack();
  };

  render() {
    const { account } = this.props;
    return (
      <SettingsRow title="Name">
        <TextInput
          autoFocus
          style={styles.textInputAS}
          placeholder="Name"
          defaultValue={account.name}
          underlineColorAndroid="transparent"
          returnKeyType="done"
          maxLength={20}
          onEndEditing={this.onNameEndEditing}
        />
      </SettingsRow>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(EditName);

const styles = StyleSheet.create({
  textInputAS: {
    padding: 5
  }
});
