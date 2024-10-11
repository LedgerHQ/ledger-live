import { Transaction as KadenaTransaction } from "@ledgerhq/live-common/families/kadena/types";
import type { Account } from "@ledgerhq/types-live";
import { useNavigation, useRoute, useTheme } from "@react-navigation/native";
import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { StyleSheet, View } from "react-native";
import LText from "~/components/LText";
import { SendFundsNavigatorStackParamList } from "~/components/RootNavigator/types/SendFundsNavigator";
import { SignTransactionNavigatorParamList } from "~/components/RootNavigator/types/SignTransactionNavigator";
import { SwapNavigatorParamList } from "~/components/RootNavigator/types/SwapNavigator";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import SummaryRow from "~/screens/SendFunds/SummaryRow";

type Navigation = BaseComposite<
  | StackNavigatorProps<SendFundsNavigatorStackParamList, ScreenName.SendSummary>
  | StackNavigatorProps<SignTransactionNavigatorParamList, ScreenName.SignTransactionSummary>
  | StackNavigatorProps<SwapNavigatorParamList, ScreenName.SwapSelectFees>
>;

type Props = {
  account: Account;
  transaction: KadenaTransaction;
} & Navigation;
export default function SendRowChainID({ account, transaction }: Props) {
  const { colors } = useTheme();
  const navigation = useNavigation<Navigation["navigation"]>();
  const route = useRoute<Navigation["route"]>();
  const editSenderId = useCallback(() => {
    navigation.navigate(ScreenName.KadenaEditSenderChainId, {
      ...route.params,
      accountId: account.id,
      parentId: undefined,
      account,
      transaction,
    });
  }, [navigation, route.params, account, transaction]);
  const editReceiverId = useCallback(() => {
    navigation.navigate(ScreenName.KadenaEditReceiverChainId, {
      ...route.params,
      accountId: account.id,
      parentId: undefined,
      account,
      transaction,
    });
  }, [navigation, route.params, account, transaction]);
  const senderId = transaction.senderChainId;
  const receiverId = transaction.receiverChainId;

  return (
    <View>
      <SummaryRow
        title={<Trans i18nKey="operationDetails.extra.senderChainId" />}
        onPress={editSenderId}
      >
        {!senderId && senderId !== 0 ? (
          <LText
            style={[
              styles.link,
              {
                textDecorationColor: colors.live,
              },
            ]}
            color="live"
            onPress={editSenderId}
          >
            <Trans i18nKey="common.edit" />
          </LText>
        ) : (
          <LText semiBold style={styles.tagText} onPress={editSenderId}>
            {String(senderId)}
          </LText>
        )}
      </SummaryRow>
      <SummaryRow
        title={<Trans i18nKey="operationDetails.extra.receiverChainId" />}
        onPress={editReceiverId}
      >
        {!receiverId && receiverId !== 0 ? (
          <LText
            style={[
              styles.link,
              {
                textDecorationColor: colors.live,
              },
            ]}
            color="live"
            onPress={editReceiverId}
          >
            <Trans i18nKey="common.edit" />
          </LText>
        ) : (
          <LText semiBold style={styles.tagText} onPress={editReceiverId}>
            {String(receiverId)}
          </LText>
        )}
      </SummaryRow>
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
