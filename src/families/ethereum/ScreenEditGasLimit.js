/* @flow */
import React, { PureComponent } from "react";
import {
  ScrollView,
  View,
  StyleSheet,
  TextInput,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-navigation";
import type { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { BigNumber } from "bignumber.js";
import { translate } from "react-i18next";
import i18next from "i18next";
import type { Account, TokenAccount } from "@ledgerhq/live-common/lib/types";
import type { Transaction } from "@ledgerhq/live-common/lib/bridge/EthereumJSBridge";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import { getMainAccount } from "@ledgerhq/live-common/lib/account";

import { accountAndParentScreenSelector } from "../../reducers/accounts";
import type { T } from "../../types/common";
import KeyboardView from "../../components/KeyboardView";
import Button from "../../components/Button";
import colors from "../../colors";

const forceInset = { bottom: "always" };

type Props = {
  account: Account | TokenAccount,
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

  constructor({ account, parentAccount, navigation }) {
    super();
    const mainAccount = getMainAccount(account, parentAccount);
    const bridge = getAccountBridge(account, parentAccount);
    const transaction = navigation.getParam("transaction");
    this.state = {
      gasLimit: bridge.getTransactionExtra(
        mainAccount,
        transaction,
        "gasLimit",
      ),
    };
  }
  onChangeTag = (gasLimit: string) => {
    this.setState({ gasLimit });
  };

  onValidateText = () => {
    const { navigation, account, parentAccount } = this.props;
    const { gasLimit } = this.state;
    const mainAccount = getMainAccount(account, parentAccount);
    const bridge = getAccountBridge(account, parentAccount);
    const transaction = navigation.getParam("transaction");
    Keyboard.dismiss();
    navigation.navigate("SendSummary", {
      accountId: account.id,
      parentId: parentAccount && parentAccount.id,
      transaction: bridge.editTransactionExtra(
        mainAccount,
        transaction,
        "gasLimit",
        BigNumber(gasLimit),
      ),
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

const mapStateToProps = accountAndParentScreenSelector;

export default connect(mapStateToProps)(translate()(EthereumEditGasLimit));
