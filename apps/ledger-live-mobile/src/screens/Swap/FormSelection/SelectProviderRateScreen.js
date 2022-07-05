// @flow
import { getAccountUnit } from "@ledgerhq/live-common/account/index";
import { useTheme } from "@react-navigation/native";
import { BigNumber } from "bignumber.js";
import React, { useCallback, useMemo } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";

import type { SwapRouteParams } from "..";
import { providerIcons } from "./RatesSection";
import CounterValue from "../../../components/CounterValue";
import CurrencyUnitValue from "../../../components/CurrencyUnitValue";
import LText from "../../../components/LText";
import { ScreenName } from "../../../const";
import Lock from "../../../icons/Lock";
import Unlock from "../../../icons/Unlock";
import { TrackScreen } from "../../../analytics";

type Props = {
  route: { params: SwapRouteParams },
  navigation: *,
};

export default function SelectProviderRateScreen({ route, navigation }: Props) {
  const { colors } = useTheme();
  const { swap = {}, rate, transaction, provider } = route.params;

  const {
    from: { account: fromAccount } = {},
    to: { currency: toCurrency } = {},
    rates: { value: rates = [] } = {},
  } = swap;
  const filteredRates = rates.filter(r => r.provider === provider);

  const fromUnit = useMemo(() => fromAccount && getAccountUnit(fromAccount), [
    fromAccount,
  ]);

  const toUnit = toCurrency?.units[0];

  const onSelectRate = useCallback(
    newRate => {
      navigation.navigate(ScreenName.SwapForm, {
        ...route.params,
        rate: newRate,
        provider: newRate.provider,
      });
    },
    [navigation, route.params],
  );

  const renderItem = useCallback(
    ({ item }) => {
      const { magnitudeAwareRate, provider, tradeMethod, payoutNetworkFees } =
        item || {};
      const ProviderIcon = providerIcons[provider];
      const isSelected =
        provider === rate?.provider && item.rate === rate?.rate;

      const toValue =
        rate && transaction
          ? transaction.amount
              .times(magnitudeAwareRate)
              .minus(payoutNetworkFees || 0)
          : null;
      return (
        <TouchableOpacity
          style={[
            styles.row,
            styles.listItem,
            { borderColor: isSelected ? colors.live : colors.lightFog },
          ]}
          onPress={() => onSelectRate(item)}
        >
          <View style={[styles.col]}>
            <View style={[styles.providerName]}>
              {ProviderIcon ? <ProviderIcon size={12} /> : null}
              <LText semiBold style={styles.valueLabel}>
                {provider}
              </LText>
            </View>
            <View style={[styles.row]}>
              {tradeMethod === "fixed" ? (
                <Lock size={12} color={colors.grey} />
              ) : (
                <Unlock size={12} color={colors.grey} />
              )}
              <LText semiBold color="grey" style={styles.subText}>
                <CurrencyUnitValue
                  value={BigNumber(10).pow(fromUnit.magnitude)}
                  unit={fromUnit}
                  showCode
                />
                {" = "}
                <CurrencyUnitValue
                  unit={toCurrency.units[0]}
                  value={BigNumber(10)
                    .pow(fromUnit.magnitude)
                    .times(magnitudeAwareRate)}
                  showCode
                />
              </LText>
            </View>
          </View>
          <View style={[styles.col]}>
            <LText semiBold style={[styles.valueLabel, styles.alignRight]}>
              <CurrencyUnitValue
                unit={toUnit}
                value={toValue ?? BigNumber(0)}
              />
            </LText>
            <LText
              semiBold
              color="grey"
              style={[styles.subText, styles.alignRight]}
            >
              <CounterValue
                currency={toCurrency}
                value={toValue ?? BigNumber(0)}
              />
            </LText>
          </View>
        </TouchableOpacity>
      );
    },
    [
      colors.grey,
      colors.lightFog,
      colors.live,
      fromUnit,
      onSelectRate,
      rate,
      toCurrency,
      toUnit,
      transaction,
    ],
  );

  return (
    <View style={styles.root}>
      <TrackScreen category="Swap Form" name="Edit Rate" provider={provider} />
      <FlatList data={filteredRates} renderItem={renderItem} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  col: {
    flexDirection: "column",
  },
  listItem: {
    height: 69,
    borderRadius: 4,
    paddingHorizontal: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  providerName: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  valueLabel: { marginLeft: 4, fontSize: 14, lineHeight: 20 },
  inputText: {
    textAlign: "right",
    fontSize: 23,
    lineHeight: 28,
    height: 32,
    padding: 0,
  },
  subText: { fontSize: 13, lineHeight: 14, paddingTop: 4 },
  alignRight: { textAlign: "right" },
});
