import React, { memo } from "react";
import { View, StyleSheet } from "react-native";
import { getCurrencyColor } from "@ledgerhq/live-common/currencies/index";
import { useTheme } from "@react-navigation/native";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { ensureContrast, rgba } from "../colors";
import { CryptoIcon } from "@ledgerhq/native-ui/pre-ldls";
import { getValidCryptoIconSizeNative } from "@ledgerhq/live-common/helpers/cryptoIconSize";

type Props = {
  currency: CryptoOrTokenCurrency;
  size: number;
  color?: string;
  sizeRatio?: number;
  testID?: string;
};

function CircleCurrencyIcon({ size, currency, color, sizeRatio = 0.5, testID }: Props) {
  const { colors, dark } = useTheme();
  const isToken = currency.type === "TokenCurrency";
  const backgroundColorContrast = ensureContrast(
    color || rgba(getCurrencyColor(currency), isToken ? 1 : 1),
    colors.background,
  );
  const initialBackgroundColor = color || rgba(getCurrencyColor(currency), isToken ? 1 : 1);
  const backgroundColor =
    initialBackgroundColor !== backgroundColorContrast
      ? backgroundColorContrast
      : initialBackgroundColor;

  const ledgerId = currency.id;
  const tickerProp = currency.ticker;
  const network = currency.type === "TokenCurrency" ? currency.parentCurrency.id : undefined;
  const iconTheme = dark ? "dark" : "light";
  const iconSize = Math.round(size * sizeRatio);
  const validIconSize = getValidCryptoIconSizeNative(iconSize);

  return (
    <View
      style={[
        styles.wrapper,
        {
          backgroundColor,
          width: size,
          height: size,
        },
      ]}
      testID={testID}
    >
      <CryptoIcon
        ledgerId={ledgerId}
        ticker={tickerProp}
        size={validIconSize}
        theme={iconTheme}
        backgroundColor={colors.background}
        {...(network && { network })}
      />
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
