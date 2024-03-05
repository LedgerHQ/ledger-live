import React, { memo } from "react";
import { View, StyleSheet } from "react-native";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import CryptoIconPOC, { useCryptoIcons } from "@ledgerhq/native-ui/components/Icon/CryptoIconPOC";

type Props = {
  currency: CryptoOrTokenCurrency;
  size: number;
  color?: string;
  sizeRatio?: number;
};

function CircleCurrencyIcon({ size, currency }: Props) {
  const { getCryptoIcon } = useCryptoIcons();
  const isToken = currency.type === "TokenCurrency";

  const token = isToken ? { tokenIconURL: getCryptoIcon(currency.parentCurrency.id) || "" } : {};
  return (
    <View
      style={[
        styles.wrapper,
        {
          width: size,
          height: size,
        },
      ]}
    >
      <CryptoIconPOC size={40} {...token} iconURL={getCryptoIcon(currency.id) || ""} circleIcon />
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
