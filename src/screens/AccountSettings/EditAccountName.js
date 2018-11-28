/* @flow */
import React, { PureComponent } from "react";
import { ScrollView, View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-navigation";
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
    accountName: "",
  };

  static navigationOptions = {
    title: "Account Name",
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
          <ScrollView contentContainerStyle={styles.root}>
            <TextInput
              autoFocus
              style={styles.textInputAS}
              defaultValue={account.name}
              returnKeyType="done"
              maxLength={20}
              onChangeText={accountName => this.setState({ accountName })}
              onSubmitEditing={this.onNameEndEditing}
              clearButtonMode="while-editing"
            />
            <View style={styles.flex}>
              <Button
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
    marginRight: 8,
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
