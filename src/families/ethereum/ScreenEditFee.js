// @flow
import React, { Component } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-navigation";
import type { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import i18next from "i18next";
import type { Account, AccountLike } from "@ledgerhq/live-common/lib/types";
import type { Transaction } from "@ledgerhq/live-common/lib/families/ethereum/types";

import colors from "../../colors";
import { accountAndParentScreenSelector } from "../../reducers/accounts";
import type { T } from "../../types/common";

import KeyboardView from "../../components/KeyboardView";
import EditFeeUnitEthereum from "./EditFeeUnitEthereum";

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

class EthereumEditFee extends Component<Props> {
  static navigationOptions = {
    title: i18next.t("send.fees.title"),
    headerLeft: null,
  };

  render() {
    const { navigation, account, parentAccount } = this.props;
    const transaction: Transaction = navigation.getParam("transaction");
    if (!transaction) return null;
    return (
      <SafeAreaView style={styles.root} forceInset={forceInset}>
        <KeyboardView style={styles.container}>
          <EditFeeUnitEthereum
            account={account}
            parentAccount={parentAccount}
            transaction={transaction}
            navigation={navigation}
          />
        </KeyboardView>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    flex: 1,
  },
});

const mapStateToProps = accountAndParentScreenSelector;

export default connect(mapStateToProps)(EthereumEditFee);
