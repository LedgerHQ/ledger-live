import React, { useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { useNavigation, useRoute, useTheme } from "@react-navigation/native";
import { Trans } from "react-i18next";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { Transaction as RippleTransaction } from "@ledgerhq/live-common/families/ripple/types";
import { useSelector } from "react-redux";
import LText from "../../components/LText";
import { ScreenName } from "../../const";
import SummaryRow from "../../screens/SendFunds/SummaryRow";
import { localeSelector } from "../../reducers/settings";
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
export default function RippleTagRow({ account, transaction }: Props) {
  const { colors } = useTheme();
  const navigation = useNavigation<Navigation["navigation"]>();
  const route = useRoute<Navigation["route"]>();
  const locale = useSelector(localeSelector);
  const editTag = useCallback(() => {
    navigation.navigate(ScreenName.RippleEditTag, {
      ...route.params,
      accountId: account.id,
      parentId: undefined,
      transaction: transaction as RippleTransaction,
    });
  }, [navigation, route.params, account.id, transaction]);
  const tag = (transaction as RippleTransaction).tag;
  return (
    <View>
      <SummaryRow title={<Trans i18nKey="send.summary.tag" />}>
        <View style={styles.tagContainer}>
          {tag && (
            <LText style={styles.tagText}>{tag.toLocaleString(locale)}</LText>
          )}
          <LText
            style={[
              styles.link,
              {
                textDecorationColor: colors.live,
              },
            ]}
            color="live"
            onPress={editTag}
          >
            <Trans i18nKey="common.edit" />
          </LText>
        </View>
      </SummaryRow>
    </View>
  );
}
const styles = StyleSheet.create({
  link: {
    textDecorationStyle: "solid",
    textDecorationLine: "underline",
    marginLeft: 8,
  },
  tagContainer: {
    flexDirection: "row",
  },
  tagText: {
    fontSize: 16,
  },
});
