/* @flow */
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import type { Transaction } from "@ledgerhq/live-common/lib/families/ethereum/types";
import type { Account, AccountLike } from "@ledgerhq/live-common/lib/types";
import { BigNumber } from "bignumber.js";
import i18next from "i18next";
import React, { PureComponent } from "react";
import { translate } from "react-i18next";
import {
  Keyboard,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import type { NavigationScreenProp } from "react-navigation";
import { SafeAreaView } from "react-navigation";
import { connect } from "react-redux";
import colors from "../../colors";
import Button from "../../components/Button";
import KeyboardView from "../../components/KeyboardView";

import { accountAndParentScreenSelector } from "../../reducers/accounts";
import type { T } from "../../types/common";

const forceInset = { bottom: "always" };

type Props = {
  account: AccountLike,
  parentAccount: ?Account,
  navigation: NavigationScreenProp<{
    params: {
      accountId: string,
      transaction: Transaction,
    },
  }>,
  t: T,
};

type State = {
  gasLimit: string,
};

class EthereumEditGasLimit extends PureComponent<Props, State> {
  static navigationOptions = {
    title: i18next.t("send.summary.gasLimit"),
    headerLeft: null,
  };

  constructor({ navigation }) {
    super();
    const transaction = navigation.getParam("transaction");
    this.state = {
      gasLimit: transaction.userGasLimit || transaction.estimatedGasLimit,
    };
  }

  onValidateText = () => {
    const { navigation, account, parentAccount } = this.props;
    const { gasLimit } = this.state;
    const bridge = getAccountBridge(account, parentAccount);
    const transaction = navigation.getParam("transaction");

    Keyboard.dismiss();
    navigation.navigate("SendSummary", {
      accountId: account.id,
      parentId: parentAccount && parentAccount.id,
      transaction: bridge.updateTransaction(transaction, {
        userGasLimit: BigNumber(gasLimit),
      }),
    });
  };

  render() {
    const { gasLimit } = this.state;
    const { t } = this.props;
    return (
      <SafeAreaView style={{ flex: 1 }} forceInset={forceInset}>
        <KeyboardView style={styles.body}>
          <ScrollView contentContainerStyle={styles.root}>
            <TextInput
              autoFocus
              style={styles.textInputAS}
              defaultValue={gasLimit ? gasLimit.toString() : ""}
              keyboardType="numeric"
              returnKeyType="done"
              maxLength={10}
              onChangeText={gasLimit => this.setState({ gasLimit })}
              onSubmitEditing={this.onValidateText}
            />

            <View style={styles.flex}>
              <Button
                event="EthereumSetGasLimit"
                type="primary"
                title={t("send.summary.validateGasLimit")}
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

export default connect(accountAndParentScreenSelector)(
  translate()(EthereumEditGasLimit),
);
