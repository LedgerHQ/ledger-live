/* @flow */
import React, { useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useNavigation, useTheme } from "@react-navigation/native";
import type { Account, AccountLike } from "@ledgerhq/live-common/types/index";
import { toLocaleString } from "@ledgerhq/live-common/currencies/BigNumberToLocaleString";
import type { Transaction } from "@ledgerhq/live-common/families/ethereum/types";
import { BigNumber } from "bignumber.js";
import type { RouteParams } from "../../screens/SendFunds/04-Summary";
import LText from "../../components/LText";
import { ScreenName } from "../../const";
import SummaryRow from "../../screens/SendFunds/SummaryRow";
import { localeSelector } from "../../reducers/settings";

type Props = {
  account: AccountLike,
  parentAccount: ?Account,
  transaction: Transaction,
  route: { params: RouteParams },
  gasLimit: ?BigNumber,
  setGasLimit: Function,
};

export default function EthereumGasLimit({
  account,
  parentAccount,
  transaction,
  route,
  gasLimit,
  setGasLimit,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const locale = useSelector(localeSelector);
  const navigation = useNavigation();

  const editGasLimit = useCallback(() => {
    navigation.navigate(ScreenName.EthereumEditGasLimit, {
      ...route.params,
      accountId: account.id,
      parentId: parentAccount && parentAccount.id,
      transaction,
      setGasLimit,
      gasLimit,
    });
  }, [navigation, route.params, account.id, parentAccount, transaction]);

  return (
    <View style={styles.root}>
      <SummaryRow
        title={
          <LText semiBold style={styles.title}>
            {t("send.summary.gasLimit")}
          </LText>
        }
        info="info"
      >
        <View style={styles.gasLimitContainer}>
          {gasLimit && (
            <LText semiBold style={styles.gasLimitText}>
              {toLocaleString(gasLimit, locale)}
            </LText>
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
  root: {
    flex: 1,
  },
  title: {
    fontSize: 20,
  },
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
