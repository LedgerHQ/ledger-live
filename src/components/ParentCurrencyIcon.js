// @flow

import React, { memo } from "react";
import { View, StyleSheet } from "react-native";

import { useTheme } from "@react-navigation/native";
import CurrencyIcon from "./CurrencyIcon";

type Props = {
  currency: *,
  size: number,
};

function ParentCurrencyIcon({ currency, size }: Props) {
  const { colors } = useTheme();
  if (currency.type === "TokenCurrency") {
    return (
      <View style={{ width: size }}>
        <View style={styles.parentIconWrapper}>
          <CurrencyIcon size={size} currency={currency.parentCurrency} />
        </View>
        <View
          style={[
            styles.tokenIconWrapper,
            {
              borderColor: colors.card,
              backgroundColor: colors.card,
            },
          ]}
        >
          <CurrencyIcon size={size - 2} currency={currency} />
        </View>
      </View>
    );
  }

  return <CurrencyIcon size={size} currency={currency} />;
}

export default memo<Props>(ParentCurrencyIcon);

const styles = StyleSheet.create({
  tokenIconWrapper: {
    flexDirection: "row",
    justifyContent: "center",
    alignContent: "center",
    marginLeft: 0,
    marginTop: -6,
    borderWidth: 2,
    borderRadius: 4,
  },
  parentIconWrapper: {
    marginLeft: -5,
  },
});
