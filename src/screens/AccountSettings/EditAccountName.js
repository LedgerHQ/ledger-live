/* @flow */
import React, { PureComponent } from "react";
import {
  ScrollView,
  View,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from "react-native";
import type { NavigationScreenProp } from "react-navigation";
import type { Account } from "@ledgerhq/live-common/lib/types";
import { connect } from "react-redux";
import { compose } from "redux";
import { translate } from "react-i18next";
import { createStructuredSelector } from "reselect";
import { accountScreenSelector } from "../../reducers/accounts";
import { updateAccount } from "../../actions/accounts";
import type { T } from "../../types/common";
import colors from "../../colors";
import BlueButton from "../../components/BlueButton";

type Props = {
  navigation: NavigationScreenProp<{
    accountId: string,
  }>,
  updateAccount: Function,
  account: Account,
  t: T,
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
    const { account, t } = this.props;
    const keyboardVerticalOffset = Platform.OS === "ios" ? 64 : 0;
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={styles.body}
          keyboardVerticalOffset={keyboardVerticalOffset}
          behavior="padding"
          enabled
        >
          <ScrollView contentContainerStyle={styles.root}>
            <TextInput
              autoFocus
              style={styles.textInputAS}
              defaultValue={account.name}
              returnKeyType="done"
              maxLength={20}
              onChangeText={accountName => this.setState({ accountName })}
              onSubmitEditing={this.onNameEndEditing}
            />
            <View style={styles.flex}>
              <BlueButton
                title={t("common:common.apply")}
                onPress={this.onNameEndEditing}
                containerStyle={[styles.buttonContainer]}
                titleStyle={[styles.buttonTitle]}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  body: {
    flexDirection: "column",
    flex: 1,
    backgroundColor: colors.white,
  },
  textInputAS: {
    padding: 16,
    fontSize: 16,
  },
  buttonContainer: {
    marginHorizontal: 16,
    height: 48,
  },
  buttonTitle: {
    fontSize: 16,
  },
  flex: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "flex-end",
    paddingBottom: 16,
  },
});
