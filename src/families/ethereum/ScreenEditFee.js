// @flow
import React from "react";
import { StyleSheet } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import { useSelector } from "react-redux";
import type { Transaction } from "@ledgerhq/live-common/lib/families/ethereum/types";
import { useTheme } from "@react-navigation/native";
import { i18n } from "../../context/Locale";
import { accountScreenSelector } from "../../reducers/accounts";
import KeyboardView from "../../components/KeyboardView";
import EditFeeUnitEthereum from "./EditFeeUnitEthereum";

const forceInset = { bottom: "always" };

const options = {
  title: i18n.t("send.summary.gasPrice"),
  headerLeft: null,
};

type Props = {
  route: { params: RouteParams },
};

type RouteParams = {
  accountId: string,
  transaction: Transaction,
  currentNavigation: string,
};

function EthereumEditFee({ route }: Props) {
  const { colors } = useTheme();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  const transaction = route.params?.transaction;

  if (!transaction || !account) return null;

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.background }]}
      forceInset={forceInset}
    >
      <KeyboardView style={styles.container}>
        <EditFeeUnitEthereum
          account={account}
          parentAccount={parentAccount}
          transaction={transaction}
          route={route}
        />
      </KeyboardView>
    </SafeAreaView>
  );
}

export { options, EthereumEditFee as component };

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
});
