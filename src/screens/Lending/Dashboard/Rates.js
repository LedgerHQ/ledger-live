// @flow
import React, { useMemo, useCallback } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { BigNumber } from "bignumber.js";
import { Trans } from "react-i18next";
import type { AccountLikeArray } from "@ledgerhq/live-common/lib/types";
import type { CurrentRate } from "@ledgerhq/live-common/lib/families/ethereum/modules/compound";
// import { formatShort } from "@ledgerhq/live-common/lib/currencies";
import { useNavigation } from "@react-navigation/native";
import LText from "../../../components/LText";
import CurrencyUnitValue from "../../../components/CurrencyUnitValue";
import CurrencyIcon from "../../../components/CurrencyIcon";
import Touchable from "../../../components/Touchable";
import colors from "../../../colors";
import { NavigatorName, ScreenName } from "../../../const";

const Row = ({
  data,
  // $FlowFixMe
  accounts,
}: {
  data: CurrentRate,
  accounts: AccountLikeArray,
}) => {
  const { token, supplyAPY } = data;
  const navigation = useNavigation();

  const navigateToEnableFlow = useCallback(() => {
    navigation.navigate(NavigatorName.LendingEnableFlow, {
      screen: ScreenName.LendingEnableSelectAccount,
      params: { currency: token },
    });
  }, [navigation, token]);

  const totalBalance = useMemo(() => {
    return accounts.reduce((total, account) => {
      if (account.type !== "TokenAccount") return total;
      if (account.token.id !== token.id) return total;

      return total.plus(account.spendableBalance);
    }, BigNumber(0));
  }, [token.id, accounts]);

  return (
    <Touchable
      style={styles.row}
      onPress={navigateToEnableFlow}
      event="Page Lend deposit"
      eventProperties={{ currency: token.id }}
    >
      <CurrencyIcon radius={100} currency={token} size={32} />
      <View style={styles.currencySection}>
        <LText semiBold style={styles.title}>
          {token.ticker}
        </LText>
        <LText style={styles.subTitle}>
          <CurrencyUnitValue
            unit={token.units[0]}
            value={totalBalance}
            showCode
          />
        </LText>
      </View>
      <LText bold style={styles.badge}>
        <Trans
          i18nKey="transfer.lending.dashboard.apy"
          values={{ value: supplyAPY }}
        />
      </LText>
    </Touchable>
  );
};

const Rates = ({
  rates,
  accounts,
}: {
  rates: CurrentRate[],
  accounts: AccountLikeArray,
}) => {
  return (
    <View>
      <FlatList
        data={rates}
        renderItem={({ item }) => <Row data={item} accounts={accounts} />}
        keyExtractor={item => item.ctoken.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    padding: 8,
    marginVertical: 4,
    backgroundColor: colors.white,
    height: 70,
    borderRadius: 4,
  },
  currencySection: { paddingHorizontal: 8, flex: 1 },
  title: {
    lineHeight: 17,
    fontSize: 14,
    color: colors.darkBlue,
  },
  subTitle: {
    lineHeight: 15,
    fontSize: 12,
    color: colors.grey,
  },
  badge: {
    fontSize: 13,
    lineHeight: 24,
    color: colors.live,
    backgroundColor: colors.lightLive,
    borderRadius: 24,
    height: 24,
    paddingHorizontal: 8,
  },
});

export default Rates;
