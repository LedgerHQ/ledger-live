import invariant from "invariant";
import React from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import type { Transaction } from "@ledgerhq/live-common/families/ripple/types";
import { useTheme } from "@react-navigation/native";
import { i18n } from "~/context/Locale";
import { accountScreenSelector } from "~/reducers/accounts";
import KeyboardView from "~/components/KeyboardView";
import EditFeeUnit from "~/components/EditFeeUnit";

const options = {
  title: i18n.t("send.fees.title"),
  headerLeft: undefined,
};
type Props = {
  route: {
    params: RouteParams;
  };
};
type RouteParams = {
  accountId: string;
  transaction: Transaction;
};

function RippleEditFee({ route }: Props) {
  const { colors } = useTheme();
  const { account } = useSelector(accountScreenSelector(route));
  if (!account) return null;
  invariant(account.type === "Account", "account must be Account type");
  const transaction = route.params?.transaction;
  if (!transaction) return null;
  return (
    <SafeAreaView
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
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
  },
  container: {
    flex: 1,
  },
});
