import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { Transaction as KadenaTransaction } from "@ledgerhq/live-common/families/kadena/types";
import type { Account } from "@ledgerhq/types-live";
import { useTheme } from "@react-navigation/native";
import invariant from "invariant";
import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { StyleSheet, View } from "react-native";
import Alert from "~/components/Alert";
import LText from "~/components/LText";
import { SendFundsNavigatorStackParamList } from "~/components/RootNavigator/types/SendFundsNavigator";
import { SignTransactionNavigatorParamList } from "~/components/RootNavigator/types/SignTransactionNavigator";
import { SwapNavigatorParamList } from "~/components/RootNavigator/types/SwapNavigator";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import TranslatedError from "~/components/TranslatedError";
import { ScreenName } from "~/const";
import { useTransactionChangeFromNavigation } from "~/logic/screenTransactionHooks";
import SummaryRow from "~/screens/SendFunds/SummaryRow";

type Navigation = BaseComposite<
  | StackNavigatorProps<SendFundsNavigatorStackParamList, ScreenName.SendSummary>
  | StackNavigatorProps<SignTransactionNavigatorParamList, ScreenName.SignTransactionSummary>
  | StackNavigatorProps<SwapNavigatorParamList, ScreenName.SwapSelectFees>
>;

type Props = {
  account: Account;
} & Navigation;
export default function SendRowChainID({ account, navigation, route }: Props) {
  const { colors } = useTheme();

  const { transaction, setTransaction, status } = useBridgeTransaction(() => ({
    transaction: route.params.transaction,
    account,
  }));
  const kdaTransaction = transaction as KadenaTransaction;
  invariant(transaction, "transaction is missing");

  // handle any edit screen changes like fees changes
  useTransactionChangeFromNavigation(setTransaction);

  const editSenderId = useCallback(() => {
    navigation.navigate(ScreenName.KadenaEditSenderChainId, {
      ...route.params,
      accountId: account.id,
      parentId: undefined,
      account,
      transaction: kdaTransaction,
    });
  }, [navigation, route.params, account, kdaTransaction]);
  const editReceiverId = useCallback(() => {
    navigation.navigate(ScreenName.KadenaEditReceiverChainId, {
      ...route.params,
      accountId: account.id,
      parentId: undefined,
      account,
      transaction: kdaTransaction,
    });
  }, [navigation, route.params, account, kdaTransaction]);
  const senderId = kdaTransaction.senderChainId;
  const receiverId = kdaTransaction.receiverChainId;
  const chainIdsWarning = status?.warnings?.chainIds;

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
      {chainIdsWarning ? (
        <Alert type="warning">
          <TranslatedError error={chainIdsWarning} />
        </Alert>
      ) : null}
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
