// @flow

import type { CryptoCurrency } from "@ledgerhq/live-common/lib/types";
import React, { memo } from "react";
import { StyleSheet, View } from "react-native";
import Icon from "react-native-vector-icons/dist/Feather";
import { useTheme } from "@react-navigation/native";
import { rgba } from "../colors";
import Alert from "../icons/Alert";
import LiveLogo from "../icons/LiveLogoIcon";
import Circle from "./Circle";
import CurrencyIcon from "./CurrencyIcon";
import Rounded from "./Rounded";
import Spinning from "./Spinning";

type Props = {
  currency: CryptoCurrency,
  size: number,
  extra?: "pending" | "done" | "notice" | "error",
};

function RoundedCurrencyIcon({ currency, size, extra }: Props) {
  const { colors } = useTheme();
  return (
    <Rounded bg={rgba(currency.color, 0.1)}>
      {extra ? (
        <View
          style={[
            styles.statusWrapper,
            { borderColor: colors.white, backgroundColor: colors.white },
          ]}
        >
          {extra === "pending" ? (
            <Spinning>
              <LiveLogo color={colors.grey} size={16} />
            </Spinning>
          ) : extra === "done" ? (
            <Circle bg={colors.green} size={24}>
              <Icon name="check" size={16} color={colors.white} />
            </Circle>
          ) : extra === "notice" ? (
            <Circle bg={colors.live} size={24}>
              <Alert size={16} color={colors.white} />
            </Circle>
          ) : (
            <Circle bg={colors.alert} size={24}>
              <Alert size={16} color={colors.white} />
            </Circle>
          )}
        </View>
      ) : null}
      <CurrencyIcon currency={currency} size={size} />
    </Rounded>
  );
}

const styles = StyleSheet.create({
  statusWrapper: {
    height: 32,
    width: 32,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    right: -8,
    top: -8,
    borderRadius: 24,
  },
});

export default memo<Props>(RoundedCurrencyIcon);
