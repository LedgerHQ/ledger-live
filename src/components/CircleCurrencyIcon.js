// @flow

import React, { memo } from "react";
import { View, StyleSheet } from "react-native";
import { getCryptoCurrencyIcon } from "@ledgerhq/live-common/lib/reactNative";
import { getCurrencyColor } from "@ledgerhq/live-common/lib/currencies";

import { useTheme } from "@react-navigation/native";
import LText from "./LText";
import { ensureContrast, rgba } from "../colors";

type Props = {
  currency: *,
  size: number,
  color?: string,
};

function CircleCurrencyIcon({ size, currency, color }: Props) {
  const { colors } = useTheme();
  const isToken = currency.type === "TokenCurrency";

  const backgroundColorContrast = ensureContrast(
    color || rgba(getCurrencyColor(currency), isToken ? 1 : 1),
    colors.background,
  );
  const initialBackgroundColor =
    color || rgba(getCurrencyColor(currency), isToken ? 1 : 1);
  const backgroundColor =
    initialBackgroundColor !== backgroundColorContrast
      ? backgroundColorContrast
      : initialBackgroundColor;
  const c = ensureContrast("#FFF", backgroundColor);

  const ticker = isToken ? currency.ticker[0] : currency.ticker;
  const MaybeIconComponent = !isToken ? getCryptoCurrencyIcon(currency) : null;
  return (
    <View
      style={[styles.wrapper, { backgroundColor, width: size, height: size }]}
    >
      {MaybeIconComponent ? (
        <MaybeIconComponent size={size / 2} color={c} />
      ) : (
        <LText semiBold style={{ color: c, fontSize: size / 2 }}>
          {ticker}
        </LText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 50,
  },
  tokenCurrencyIcon: {
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default memo<Props>(CircleCurrencyIcon);
