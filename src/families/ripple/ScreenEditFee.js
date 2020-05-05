// @flow
import React from "react";
import { StyleSheet } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import { useSelector } from "react-redux";
import type { Transaction } from "@ledgerhq/live-common/lib/families/ripple/types";
import colors from "../../colors";
import { i18n } from "../../context/Locale";
import { accountScreenSelector } from "../../reducers/accounts";
import KeyboardView from "../../components/KeyboardView";
import EditFeeUnit from "../../components/EditFeeUnit";

const forceInset = { bottom: "always" };

const options = {
  title: i18n.t("send.fees.title"),
  headerLeft: null,
};

type Props = {
  route: { params: RouteParams },
};

type RouteParams = {
  accountId: string,
  transaction: Transaction,
};

function RippleEditFee({ route }: Props) {
  const { account } = useSelector(accountScreenSelector(route));
  const transaction = route.params?.transaction;

  if (!transaction) return null;

  return (
    <SafeAreaView style={styles.root} forceInset={forceInset}>
      <KeyboardView style={styles.container}>
        <EditFeeUnit account={account} field="fee" />
      </KeyboardView>
    </SafeAreaView>
  );
}

export { options, RippleEditFee as component };

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    flex: 1,
  },
});
