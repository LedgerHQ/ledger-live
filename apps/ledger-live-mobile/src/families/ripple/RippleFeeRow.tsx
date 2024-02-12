import React, { useCallback } from "react";
import { View, StyleSheet, Linking } from "react-native";
import { Trans } from "react-i18next";
import {
  CompositeNavigationProp,
  useNavigation,
  useRoute,
  useTheme,
} from "@react-navigation/native";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { Transaction as RippleTransaction } from "@ledgerhq/live-common/families/ripple/types";
import SummaryRow from "~/screens/SendFunds/SummaryRow";
import LText from "~/components/LText";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import CounterValue from "~/components/CounterValue";
import ExternalLink from "~/icons/ExternalLink";
import { urls } from "~/utils/urls";
import { ScreenName } from "~/const";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type {
  BaseComposite,
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import type { SendFundsNavigatorStackParamList } from "~/components/RootNavigator/types/SendFundsNavigator";
import { SignTransactionNavigatorParamList } from "~/components/RootNavigator/types/SignTransactionNavigator";
import { SwapNavigatorParamList } from "~/components/RootNavigator/types/SwapNavigator";

type Navigation = CompositeNavigationProp<
  StackNavigatorNavigation<SendFundsNavigatorStackParamList, ScreenName.SendSummary>,
  StackNavigatorNavigation<BaseNavigatorStackParamList>
>;

type Route = BaseComposite<
  | StackNavigatorProps<SendFundsNavigatorStackParamList, ScreenName.SendSummary>
  | StackNavigatorProps<SignTransactionNavigatorParamList, ScreenName.SignTransactionSummary>
  | StackNavigatorProps<SwapNavigatorParamList, ScreenName.SwapSelectFees>
>["route"];

type Props = {
  account: AccountLike;
  parentAccount?: Account | null;
  transaction: Transaction;
};

export default function RippleFeeRow({ account, transaction, parentAccount }: Props) {
  const { colors } = useTheme();
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const openFees = useCallback(() => {
    navigation.navigate(ScreenName.RippleEditFee, {
      ...route.params,
      accountId: account.id,
      parentId: parentAccount?.id,
      transaction: transaction as RippleTransaction,
    });
  }, [navigation, route.params, account.id, parentAccount?.id, transaction]);
  const extraInfoFees = useCallback(() => {
    Linking.openURL(urls.feesMoreInfo);
  }, []);
  if (account.type !== "Account") return null;
  const fee = (transaction as RippleTransaction).fee;
  const feeCustomUnit = (transaction as RippleTransaction).feeCustomUnit;
  return (
    <SummaryRow
      onPress={extraInfoFees}
      title={<Trans i18nKey="send.fees.title" />}
      additionalInfo={
        <View>
          <ExternalLink size={12} color={colors.grey} />
        </View>
      }
    >
      <View
        style={{
          alignItems: "flex-end",
        }}
      >
        <View style={styles.accountContainer}>
          {fee ? (
            <LText style={styles.valueText}>
              <CurrencyUnitValue unit={feeCustomUnit || account.unit} value={fee} />
            </LText>
          ) : null}

          <LText
            style={[
              styles.link,
              {
                textDecorationColor: colors.live,
              },
            ]}
            color="live"
            onPress={openFees}
          >
            <Trans i18nKey="common.edit" />
          </LText>
        </View>
        <LText style={styles.countervalue} color="grey">
          {fee ? <CounterValue before="≈ " value={fee} currency={account.currency} /> : null}
        </LText>
      </View>
    </SummaryRow>
  );
}

const styles = StyleSheet.create({
  accountContainer: {
    flex: 1,
    flexDirection: "row",
  },
  summaryRowText: {
    fontSize: 16,
    textAlign: "right",
  },
  countervalue: {
    fontSize: 12,
  },
  valueText: {
    fontSize: 16,
  },
  link: {
    textDecorationStyle: "solid",
    textDecorationLine: "underline",
    marginLeft: 8,
  },
});
