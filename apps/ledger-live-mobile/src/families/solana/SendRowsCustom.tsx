import {
  SolanaAccount,
  Transaction as SolanaTransaction,
} from "@ledgerhq/live-common/families/solana/types";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import { Account } from "@ledgerhq/types-live";
import { Text } from "@ledgerhq/native-ui";
import { useTheme } from "@react-navigation/native";
import invariant from "invariant";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { ScreenName } from "../../const";
import SummaryRow from "../../screens/SendFunds/SummaryRow";
import {
  BaseComposite,
  StackNavigatorProps,
} from "../../components/RootNavigator/types/helpers";
import { SendFundsNavigatorStackParamList } from "../../components/RootNavigator/types/SendFundsNavigator";
import { SignTransactionNavigatorParamList } from "../../components/RootNavigator/types/SignTransactionNavigator";
import { SwapNavigatorParamList } from "../../components/RootNavigator/types/SwapNavigator";

type Navigation = BaseComposite<
  | StackNavigatorProps<
      SendFundsNavigatorStackParamList,
      ScreenName.SendSummary
    >
  | StackNavigatorProps<
      SignTransactionNavigatorParamList,
      ScreenName.SignTransactionSummary
    >
  | StackNavigatorProps<SwapNavigatorParamList, ScreenName.SwapSelectFees>
>;

type Props = {
  account: Account;
  transaction: Transaction;
} & Navigation;

export default function SolanaSendRowsCustom({
  account,
  transaction,
  navigation,
  route,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { model } = transaction as SolanaTransaction;
  invariant(model.kind === "transfer", "must be a transfer tx");

  const editMemo = useCallback(() => {
    navigation.navigate(ScreenName.SolanaEditMemo, {
      ...route.params,
      accountId: account.id,
      parentId: undefined,
      account: account as SolanaAccount,
      transaction: transaction as SolanaTransaction,
    });
  }, [navigation, route.params, account, transaction]);

  return (
    <View>
      <SummaryRow title={t("send.summary.memo.title")} onPress={editMemo}>
        {model.uiState.memo ? (
          <Text
            fontWeight="semiBold"
            style={styles.tagText}
            onPress={editMemo}
            numberOfLines={1}
          >
            {model.uiState.memo}
          </Text>
        ) : (
          <Text
            style={[
              styles.link,
              {
                textDecorationColor: colors.live,
              },
            ]}
            color="live"
            onPress={editMemo}
          >
            {t("common.edit")}
          </Text>
        )}
      </SummaryRow>
    </View>
  );
}

const styles = StyleSheet.create({
  memoContainer: {
    flexDirection: "row",
  },
  tagText: {
    flex: 1,
    fontSize: 14,
    textAlign: "right",
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
