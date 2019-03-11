/* @flow */
import React, { PureComponent } from "react";
import i18next from "i18next";
import { View, StyleSheet } from "react-native";
// $FlowFixMe
import { SafeAreaView, ScrollView } from "react-navigation";
import type { NavigationScreenProp } from "react-navigation";
import type { Account } from "@ledgerhq/live-common/lib/types";
import { connect } from "react-redux";
import { compose } from "redux";
import { Trans, translate } from "react-i18next";
import { createStructuredSelector } from "reselect";
import { accountScreenSelector } from "../../reducers/accounts";
import { updateAccount } from "../../actions/accounts";
import Button from "../../components/Button";
import TextInput from "../../components/TextInput";
import KeyboardView from "../../components/KeyboardView";
import { getFontStyle } from "../../components/LText";

import colors from "../../colors";

export const MAX_ACCOUNT_NAME_LENGHT = 50;

type Props = {
  navigation: NavigationScreenProp<{
    accountId: string,
  }>,
  updateAccount: Function,
  account: Account,
};

type State = {
  accountName: string,
};
const mapStateToProps = createStructuredSelector({
  account: accountScreenSelector,
});
const mapDispatchToProps = {
  updateAccount,
};
class EditAccountName extends PureComponent<Props, State> {
  state = {
    accountName: this.props.account.name,
  };

  static navigationOptions = {
    title: i18next.t("account.settings.accountName.title"),
    headerRight: null,
  };

  onChangeText = (accountName: string) => {
    this.setState({ accountName });
  };

  onNameEndEditing = () => {
    const { updateAccount, account, navigation } = this.props;
    const { accountName } = this.state;
    if (accountName.length) {
      updateAccount({
        ...account,
        name: accountName,
      });
    }
    navigation.goBack();
  };

  render() {
    const { account } = this.props;

    return (
      <SafeAreaView style={styles.safeArea}>
        <KeyboardView style={styles.body}>
          <ScrollView
            contentContainerStyle={styles.root}
            keyboardShouldPersistTaps="handled"
          >
            <TextInput
              autoFocus
              style={styles.textInputAS}
              defaultValue={account.name}
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
                containerStyle={styles.buttonContainer}
              />
            </View>
          </ScrollView>
        </KeyboardView>
      </SafeAreaView>
    );
  }
}

export default compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  translate(),
)(EditAccountName);

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  body: {
    flexDirection: "column",
    flex: 1,
    backgroundColor: colors.white,
  },
  textInputAS: {
    padding: 16,
    fontSize: 20,
    color: colors.darkBlue,
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
