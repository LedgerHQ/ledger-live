import React, { useCallback } from "react";
import { BigNumber } from "bignumber.js";
import { View, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { Account } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/coin-evm/types/index";
import { useNavigation, useRoute, useTheme } from "@react-navigation/native";
import { toLocaleString } from "@ledgerhq/live-common/currencies/index";
import { Navigation, RouteProps } from "./EvmCustomFees/types";
import SummaryRow from "~/screens/SendFunds/SummaryRow";
import LText from "~/components/LText";
import { ScreenName } from "~/const";
import { useSettings } from "~/hooks";

type Props = {
  account: Account;
  transaction: Transaction;
  gasLimit?: BigNumber | null;
  setGasLimit: (_: BigNumber) => void;
};

export default function EvmGasLimit({ account, transaction, gasLimit, setGasLimit }: Props) {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<Navigation>();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { locale } = useSettings();
  const editGasLimit = useCallback(() => {
    navigation.navigate(ScreenName.EvmEditGasLimit, {
      ...route.params,
      accountId: account.id,
      transaction,
      setGasLimit,
      gasLimit,
    });
  }, [navigation, route.params, account.id, transaction, setGasLimit, gasLimit]);
  return (
    <View style={styles.root}>
      <SummaryRow
        title={
          <LText semiBold style={styles.title}>
            {t("send.summary.gasLimit")}
          </LText>
        }
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
              {
                color: colors.live,
                textDecorationColor: colors.live,
              },
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
