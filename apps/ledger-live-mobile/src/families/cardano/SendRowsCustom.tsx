import React, { useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation, useRoute, useTheme } from "@react-navigation/native";
import type { Account } from "@ledgerhq/types-live";
import type {
  CardanoAccount,
  Transaction as CardanoTransaction,
} from "@ledgerhq/live-common/families/cardano/types";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import LText from "../../components/LText";
import { ScreenName } from "../../const";
import SummaryRow from "../../screens/SendFunds/SummaryRow";
import type {
  BaseComposite,
  StackNavigatorProps,
} from "../../components/RootNavigator/types/helpers";
import type { SendFundsNavigatorStackParamList } from "../../components/RootNavigator/types/SendFundsNavigator";
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
export default function CardanoSendRowsCustom(props: Props) {
  const { account } = props;
  const transaction = props.transaction as CardanoTransaction;
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<Navigation["navigation"]>();
  const route = useRoute<Navigation["route"]>();
  const editMemo = useCallback(() => {
    navigation.navigate(ScreenName.CardanoEditMemo, {
      ...route.params,
      accountId: account.id,
      parentId: undefined,
      account: account as CardanoAccount,
      transaction,
    });
  }, [navigation, route.params, account, transaction]);
  return (
    <View>
      <SummaryRow title={t("send.summary.memo.title")} onPress={editMemo}>
        {transaction.memo ? (
          <LText
            semiBold
            style={styles.tagText}
            onPress={editMemo}
            numberOfLines={1}
          >
            {transaction.memo}
          </LText>
        ) : (
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
            {t("common.edit")}
          </LText>
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
