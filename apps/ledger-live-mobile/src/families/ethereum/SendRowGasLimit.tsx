import React, { useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { toLocaleString } from "@ledgerhq/live-common/currencies/BigNumberToLocaleString";
import type { Transaction } from "@ledgerhq/live-common/families/ethereum/types";
import { BigNumber } from "bignumber.js";
import LText from "../../components/LText";
import { ScreenName } from "../../const";
import SummaryRow from "../../screens/SendFunds/SummaryRow";
import { localeSelector } from "../../reducers/settings";
import type {
  BaseComposite,
  StackNavigatorProps,
} from "../../components/RootNavigator/types/helpers";
import type { SendFundsNavigatorStackParamList } from "../../components/RootNavigator/types/SendFundsNavigator";

type Navigation = BaseComposite<
  StackNavigatorProps<SendFundsNavigatorStackParamList, ScreenName.SendSummary>
>;

type Props = {
  account: AccountLike;
  parentAccount?: Account | null;
  transaction: Transaction;
  gasLimit?: BigNumber | null;
  setGasLimit: (_: BigNumber) => void;
} & Navigation;

export default function EthereumGasLimit({
  account,
  parentAccount,
  transaction,
  route,
  navigation,
  gasLimit,
  setGasLimit,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const locale = useSelector(localeSelector);
  const editGasLimit = useCallback(() => {
    navigation.navigate(ScreenName.EthereumEditGasLimit, {
      ...route.params,
      accountId: account.id,
      parentId: parentAccount?.id,
      transaction,
      setGasLimit,
      gasLimit,
    });
  }, [
    navigation,
    route.params,
    account.id,
    parentAccount,
    transaction,
    setGasLimit,
    gasLimit,
  ]);
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
