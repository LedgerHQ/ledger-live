/* @flow */
import React, { PureComponent } from "react";
import { View, StyleSheet, TextInput } from "react-native";
// $FlowFixMe
import { SafeAreaView, ScrollView } from "react-navigation";
import type { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import { translate } from "react-i18next";
import i18next from "i18next";
import type { Account } from "@ledgerhq/live-common/lib/types";
import type { Transaction } from "@ledgerhq/live-common/lib/families/stellar/types";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import KeyboardView from "../../components/KeyboardView";
import Button from "../../components/Button";
import { accountScreenSelector } from "../../reducers/accounts";

import colors from "../../colors";
import type { T } from "../../types/common";

const forceInset = { bottom: "always" };

type Props = {
  account: Account,
  navigation: NavigationScreenProp<{
    params: {
      accountId: string,
      transaction: Transaction,
      memoType: string,
    },
  }>,
  t: T,
};

type State = {
  memoValue: ?string,
};

class StellarEditMemoValue extends PureComponent<Props, State> {
  static navigationOptions = {
    title: i18next.t("send.summary.memo.value"),
    headerLeft: null,
  };

  constructor({ navigation }) {
    super();
    const transaction = navigation.getParam("transaction");
    this.state = {
      memoValue: transaction.memoValue,
    };
  }

  onChangeMemoValue = (str: string) => {
    this.setState({ memoValue: str });
  };

  onValidateText = () => {
    const { navigation, account } = this.props;
    const { memoValue } = this.state;
    const bridge = getAccountBridge(account);
    const transaction = navigation.getParam("transaction");
    const memoType = navigation.getParam("memoType");
    navigation.navigate("SendSummary", {
      accountId: account.id,
      transaction: bridge.updateTransaction(transaction, {
        memoValue: memoValue && memoValue.toString(),
        memoType: memoType && memoType.toString(),
      }),
    });
  };

  render() {
    const { memoValue } = this.state;
    const { t } = this.props;
    return (
      <SafeAreaView style={{ flex: 1 }} forceInset={forceInset}>
        <KeyboardView style={styles.body}>
          <ScrollView
            contentContainerStyle={styles.root}
            keyboardShouldPersistTaps="always"
          >
            <TextInput
              allowFontScaling={false}
              autoFocus
              style={styles.textInputAS}
              defaultValue={memoValue ? memoValue.toString() : ""}
              keyboardType="default"
              returnKeyType="done"
              onChangeText={this.onChangeMemoValue}
              onSubmitEditing={this.onValidateText}
            />

            <View style={styles.flex}>
              <Button
                event="StellarEditMemoValue"
                type="primary"
                title={t("send.summary.validateMemo")}
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

export default connect(mapStateToProps)(translate()(StellarEditMemoValue));
