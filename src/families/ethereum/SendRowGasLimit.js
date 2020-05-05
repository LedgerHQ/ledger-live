/* @flow */
import React, { useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import type { Account, AccountLike } from "@ledgerhq/live-common/lib/types";
import type { Transaction } from "@ledgerhq/live-common/lib/families/ethereum/types";
import LText from "../../components/LText";
import colors from "../../colors";
import { ScreenName } from "../../const";
import SummaryRow from "../../screens/SendFunds/SummaryRow";

type Props = {
  account: AccountLike,
  parentAccount: ?Account,
  transaction: Transaction,
};

export default function EthereumGasLimit({
  account,
  parentAccount,
  transaction,
}: Props) {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const editGasLimit = useCallback(() => {
    navigation.navigate(ScreenName.EthereumEditGasLimit, {
      accountId: account.id,
      parentId: parentAccount && parentAccount.id,
      transaction,
    });
  }, [navigation, account, parentAccount, transaction]);

  const gasLimit = transaction.userGasLimit || transaction.estimatedGasLimit;

  return (
    <View>
      <SummaryRow title={t("send.summary.gasLimit")} info="info">
        <View style={styles.gasLimitContainer}>
          {gasLimit && (
            <LText style={styles.gasLimitText}>{gasLimit.toString()}</LText>
          )}
          <LText style={styles.link} onPress={editGasLimit}>
            {t("common.edit")}
          </LText>
        </View>
      </SummaryRow>
    </View>
  );
}

const styles = StyleSheet.create({
  link: {
    color: colors.live,
    textDecorationStyle: "solid",
    textDecorationLine: "underline",
    textDecorationColor: colors.live,
    marginLeft: 8,
  },
  gasLimitContainer: {
    flexDirection: "row",
  },
  gasLimitText: {
    fontSize: 16,
    color: colors.darkBlue,
  },
});
