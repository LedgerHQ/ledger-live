import React, { useCallback, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { useNavigation, useRoute, useTheme } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { ScreenName } from "~/const";
import SummaryRow from "~/screens/SendFunds/SummaryRow";
import LText from "~/components/LText";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type {
  CantonAccount,
  Transaction as CantonTransaction,
} from "@ledgerhq/live-common/families/canton/types";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { SendFundsNavigatorStackParamList } from "~/components/RootNavigator/types/SendFundsNavigator";
import type { SignTransactionNavigatorParamList } from "~/components/RootNavigator/types/SignTransactionNavigator";
import type { SwapNavigatorParamList } from "~/components/RootNavigator/types/SwapNavigator";

const secondsToDurationKey: Record<number, string> = {
  [3 * 60 * 60]: "canton.expiryDuration.threeHours",
  [6 * 60 * 60]: "canton.expiryDuration.sixHours",
  [24 * 60 * 60]: "canton.expiryDuration.oneDay",
  [7 * 24 * 60 * 60]: "canton.expiryDuration.oneWeek",
  [30 * 24 * 60 * 60]: "canton.expiryDuration.oneMonth",
};

type Navigation = BaseComposite<
  | StackNavigatorProps<SendFundsNavigatorStackParamList, ScreenName.SendSummary>
  | StackNavigatorProps<SignTransactionNavigatorParamList, ScreenName.SignTransactionSummary>
  | StackNavigatorProps<SwapNavigatorParamList, ScreenName.SwapSelectFees>
>;

type Props = {
  account: Account;
  transaction: Transaction;
} & Navigation;

export default function CantonSendRowsCustom(props: Props) {
  const { account } = props;
  const transaction = props.transaction as CantonTransaction;
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<Navigation["navigation"]>();
  const route = useRoute<Navigation["route"]>();

  const editMemo = useCallback(() => {
    (navigation as { navigate: (screen: string, params?: unknown) => void }).navigate(
      ScreenName.CantonEditMemo,
      {
        ...route.params,
        accountId: account.id,
        parentId: undefined,
        account: account as CantonAccount,
        transaction,
      },
    );
  }, [navigation, route.params, account, transaction]);

  const expiryDurationLabel = useMemo(() => {
    const seconds = transaction.expireInSeconds ?? 24 * 60 * 60;
    const key = secondsToDurationKey[seconds];
    return t(key);
  }, [t, transaction.expireInSeconds]);

  return (
    <View>
      <SummaryRow title={t("send.summary.memo.title")} onPress={editMemo}>
        {transaction.memo ? (
          <LText
            semiBold
            style={styles.tagText}
            onPress={editMemo}
            numberOfLines={1}
            testID="summary-memo-tag"
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
      <SummaryRow title={t("canton.expiryDuration.summaryLabel")}>
        <LText semiBold style={styles.tagText} numberOfLines={1} testID="summary-expiry-duration">
          {expiryDurationLabel}
        </LText>
      </SummaryRow>
    </View>
  );
}

const styles = StyleSheet.create({
  memoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  tagText: {
    flex: 1,
    textAlign: "right",
  },
  link: {
    textDecorationLine: "underline",
  },
});
