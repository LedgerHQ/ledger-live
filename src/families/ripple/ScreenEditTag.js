/* @flow */
import React, { PureComponent } from "react";
import {
  ScrollView,
  View,
  StyleSheet,
  TextInput,
  SafeAreaView,
  Keyboard,
} from "react-native";
import type { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import { translate } from "react-i18next";
import i18next from "i18next";
import type { Account } from "@ledgerhq/live-common/lib/types";
import type { Transaction } from "../../bridge/RippleJSBridge";
import { getAccountBridge } from "../../bridge";
import KeyboardView from "../../components/KeyboardView";
import Button from "../../components/Button";
import { accountScreenSelector } from "../../reducers/accounts";

import colors from "../../colors";
import type { T } from "../../types/common";

type Props = {
  account: Account,
  navigation: NavigationScreenProp<{
    accountId: string,
    transaction: Transaction,
  }>,
  t: T,
};

type State = {
  tag: string,
};

class RippleEditTag extends PureComponent<Props, State> {
  static navigationOptions = {
    title: i18next.t("send.summary.tag"),
  };

  constructor({ account, navigation }) {
    super();
    const bridge = getAccountBridge(account);
    const transaction = navigation.getParam("transaction");
    this.state = {
      tag: bridge.getTransactionExtra(account, transaction, "tag"),
    };
  }
  onChangeTag = (tag: string) => {
    this.setState({ tag });
  };

  onValidateText = () => {
    const { navigation, account } = this.props;
    const { tag } = this.state;
    const bridge = getAccountBridge(account);
    const transaction = navigation.getParam("transaction");
    Keyboard.dismiss();
    navigation.navigate("SendSummary", {
      accountId: account.id,
      transaction: bridge.editTransactionExtra(
        account,
        transaction,
        "tag",
        parseInt(tag, 10),
      ),
    });
  };

  render() {
    const { tag } = this.state;
    const { t } = this.props;
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardView style={styles.body}>
          <ScrollView contentContainerStyle={styles.root}>
            <TextInput
              autoFocus
              style={styles.textInputAS}
              defaultValue={tag ? tag.toString() : ""}
              keyboardType="numeric"
              returnKeyType="done"
              maxLength={10}
              onChangeText={this.onChangeTag}
              onSubmitEditing={this.onValidateText}
            />

            <View style={styles.flex}>
              <Button
                type="primary"
                title={t("send.summary.validateTag")}
                onPress={this.onValidateText}
                containerStyle={styles.buttonContainer}
              />
            </View>
          </ScrollView>
        </KeyboardView>
      </SafeAreaView>
    );
  }
}

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
    fontSize: 30,
    color: colors.darkBlue,
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

const mapStateToProps = createStructuredSelector({
  account: accountScreenSelector,
});

export default connect(mapStateToProps)(translate()(RippleEditTag));
