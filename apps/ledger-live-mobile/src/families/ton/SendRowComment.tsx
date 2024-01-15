import React, { useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { Trans } from "react-i18next";
import { useNavigation, useRoute, useTheme } from "@react-navigation/native";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction as TonTransaction } from "@ledgerhq/live-common/families/ton/types";
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
  transaction: TonTransaction;
} & Navigation;
export default function TonCommentRow({ account, transaction }: Props) {
  const { colors } = useTheme();
  const navigation = useNavigation<Navigation["navigation"]>();
  const route = useRoute<Navigation["route"]>();
  const editComment = useCallback(() => {
    navigation.navigate(ScreenName.TonEditComment, {
      ...route.params,
      accountId: account.id,
      parentId: undefined,
      account,
      transaction,
    });
  }, [navigation, route.params, account, transaction]);
  const comment = transaction.comment;
  return (
    <View>
      {!comment || comment.isEncrypted || !transaction.comment.text ? (
        <SummaryRow title={<Trans i18nKey="send.summary.comment" />} onPress={editComment}>
          <LText
            style={[
              styles.link,
              {
                textDecorationColor: colors.live,
              },
            ]}
            color="live"
            onPress={editComment}
          >
            <Trans i18nKey="common.edit" />
          </LText>
        </SummaryRow>
      ) : (
        <SummaryRow title={<Trans i18nKey="common.edit" />} onPress={editComment}>
          <LText semiBold style={styles.tagText} onPress={editComment}>
            {String(comment.text)}
          </LText>
        </SummaryRow>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  commentContainer: {
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
  comment: {
    marginBottom: 10,
  },
});
