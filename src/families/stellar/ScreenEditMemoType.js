/* @flow */
import React from "react";
import { View, StyleSheet } from "react-native";
import { connect } from "react-redux";
import { Trans } from "react-i18next";
import i18next from "i18next";
import { StellarMemoType } from "@ledgerhq/live-common/lib/families/stellar/types";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import LText from "../../components/LText";
import type { State } from "../../reducers";
import colors from "../../colors";
import makeGenericSelectScreen from "../../screens/makeGenericSelectScreen";

const items = StellarMemoType.map(type => ({
  label: type,
  value: type,
}));

const mapStateToProps = (state: State, props: *) => ({
  selectedKey: props.navigation.state.params.transaction.memoType
    ? props.navigation.state.params.transaction.memoType
    : "NO_MEMO",
  items,
  cancelNavigateBack: true,
  onValueChange: ({ value }) => {
    const { navigation } = props;
    const transaction = navigation.getParam("transaction");
    const account = navigation.getParam("account");
    if (value === "NO_MEMO") {
      const bridge = getAccountBridge(account);
      navigation.navigate("SendSummary", {
        accountId: account.id,
        transaction: bridge.updateTransaction(transaction, {
          memoType: value,
          memoValue: null,
        }),
      });
    } else {
      navigation.navigate("StellarEditMemoValue", {
        accountId: account.id,
        transaction,
        memoType: value,
      });
    }
  },
});

const Screen = makeGenericSelectScreen({
  id: "StellarEditMemoType",
  itemEventProperties: item => ({ memoType: item.value }),
  title: i18next.t("send.summary.memo.type"),
  keyExtractor: item => item.value,
  formatItem: item => i18next.t(`stellar.memoType.${item.label}`),
  ListHeaderComponent: () => (
    <View style={styles.memo}>
      <LText style={styles.text}>
        <Trans i18nKey="stellar.memo.warning" />
      </LText>
    </View>
  ),
});

const styles = StyleSheet.create({
  memo: {
    marginBottom: 16,
    padding: 16,
  },
  text: {
    fontSize: 14,
    color: colors.darkBlue,
  },
});

export default connect(mapStateToProps)(Screen);
