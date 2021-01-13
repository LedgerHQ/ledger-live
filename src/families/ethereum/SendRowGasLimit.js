/* @flow */
import React, { useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation, useTheme } from "@react-navigation/native";
import type { Account, AccountLike } from "@ledgerhq/live-common/lib/types";
import type { Transaction } from "@ledgerhq/live-common/lib/families/ethereum/types";
import type { RouteParams } from "../../screens/SendFunds/04-Summary";
import LText from "../../components/LText";
import { ScreenName } from "../../const";
import SummaryRow from "../../screens/SendFunds/SummaryRow";

type Props = {
  account: AccountLike,
  parentAccount: ?Account,
  transaction: Transaction,
  route: { params: RouteParams },
};

export default function EthereumGasLimit({
  account,
  parentAccount,
  transaction,
  route,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();

  const editGasLimit = useCallback(() => {
    navigation.navigate(ScreenName.EthereumEditGasLimit, {
      ...route.params,
      accountId: account.id,
      parentId: parentAccount && parentAccount.id,
      transaction,
    });
  }, [navigation, route.params, account.id, parentAccount, transaction]);

  const gasLimit = transaction.userGasLimit || transaction.estimatedGasLimit;

  return (
    <View>
      <SummaryRow title={t("send.summary.gasLimit")} info="info">
        <View style={styles.gasLimitContainer}>
          {gasLimit && (
            <LText style={styles.gasLimitText}>{gasLimit.toString()}</LText>
          )}
          <LText
            style={[
              styles.link,
              { color: colors.live, textDecorationColor: colors.live },
            ]}
            onPress={editGasLimit}
          >
            {t("common.edit")}
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
  gasLimitContainer: {
    flexDirection: "row",
  },
  gasLimitText: {
    fontSize: 16,
  },
});
