// @flow

import React from "react";
import { StyleSheet } from "react-native";
// $FlowFixMe
import { SafeAreaView } from "react-navigation";
import type { NavigationScreenProp } from "react-navigation";
import type {
  Account,
  AccountLikeArray,
} from "@ledgerhq/live-common/lib/types";
import { useSelector } from "react-redux";
import colors from "../../colors";
import { flattenAccountsSelector } from "../../reducers/accounts";

import CoinifyWidget from "./CoinifyWidget";

type Navigation = NavigationScreenProp<{ params: {} }>;

type Props = {
  accounts: Account[],
  allAccounts: AccountLikeArray,
  navigation: Navigation,
  route: { params: RouteParams },
};

export default function CoinifyWidgetScreen({ route }: Props) {
  const allAccounts = useSelector(flattenAccountsSelector);
  const accountId = route.params.accountId;
  const mode = route.params.mode;
  const meta = route.params.meta;
  const account = allAccounts.find(a => a.id === accountId);

  const forceInset = { bottom: "always" };

  return (
    <SafeAreaView style={[styles.root]} forceInset={forceInset}>
      <CoinifyWidget account={account} meta={meta} mode={mode} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.lightGrey,
  },
  center: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
  },
});
