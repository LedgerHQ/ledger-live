import React, { useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { Trans } from "react-i18next";
import { useNavigation, useRoute, useTheme } from "@react-navigation/native";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { Transaction as StacksTransaction } from "@ledgerhq/live-common/families/stacks/types";
import LText from "~/components/LText";
import { ScreenName } from "~/const";
import SummaryRow from "~/screens/SendFunds/SummaryRow";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { SendFundsNavigatorStackParamList } from "~/components/RootNavigator/types/SendFundsNavigator";
import { SignTransactionNavigatorParamList } from "~/components/RootNavigator/types/SignTransactionNavigator";
import { SwapNavigatorParamList } from "~/components/RootNavigator/types/SwapNavigator";

type Navigation = BaseComposite<
  | StackNavigatorProps<SendFundsNavigatorStackParamList, ScreenName.SendSummary>
  | StackNavigatorProps<SignTransactionNavigatorParamList, ScreenName.SignTransactionSummary>
  | StackNavigatorProps<SwapNavigatorParamList, ScreenName.SwapSelectFees>
>;

type Props = {
  account: Account;
  transaction: Transaction;
} & Navigation;
export default function StacksMemoRow({ account, transaction }: Props) {
  const { colors } = useTheme();
  const navigation = useNavigation<Navigation["navigation"]>();
  const route = useRoute<Navigation["route"]>();
  const editMemo = useCallback(() => {
    navigation.navigate(ScreenName.StacksEditMemo, {
      ...route.params,
      accountId: account.id,
      parentId: undefined,
      account,
      transaction: transaction as StacksTransaction,
    });
  }, [navigation, route.params, account, transaction]);
  const memo = (transaction as StacksTransaction).memo;
  return (
    <View>
      {!memo ? (
        <SummaryRow title={<Trans i18nKey="send.summary.memo.title" />} onPress={editMemo}>
          <LText
            style={[
              styles.link,
              {
                textDecorationColor: colors.live,
              },
            ]}
            color="live"
            onPress={editMemo}
          >
            <Trans i18nKey="common.edit" />
          </LText>
        </SummaryRow>
      ) : (
        <SummaryRow title={<Trans i18nKey="common.edit" />} onPress={editMemo}>
          <LText semiBold style={styles.tagText} onPress={editMemo} testID="summary-memo-tag">
            {String(memo)}
          </LText>
        </SummaryRow>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  memoContainer: {
    flexDirection: "row",
  },
  tagText: {
    fontSize: 14,
  },
  link: {
    textDecorationStyle: "solid",
    textDecorationLine: "underline",
    marginLeft: 8,
  },
  memo: {
    marginBottom: 10,
  },
});
