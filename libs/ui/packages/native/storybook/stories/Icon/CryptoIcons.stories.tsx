import { View } from "react-native";
import { storiesOf } from "../storiesOf";
import React from "react";
import { CryptoIcons } from "../../../src/assets";
import { BTC, ETH, DOT } from "../../../src/assets/cryptoIcons";
import { useTheme } from "styled-components/native";
import * as cryptoIcons from "@ledgerhq/crypto-icons-ui/native";
import { number, select, color } from "@storybook/addon-knobs";

const IconSample = () => (
  <View>
    <BTC />
    <ETH />
    <DOT />
    <BTC color={"orange"} />
    <ETH color={"green"} />
    <DOT color={"pink"} />
    <BTC size={64} />
    <ETH size={64} />
    <DOT size={64} />
    <CryptoIcons.DOGE></CryptoIcons.DOGE>
  </View>
);

const SingleCryptoIcon = () => {
  const theme = useTheme();
  const name = select("name", Object.keys(cryptoIcons), "BTC") as keyof typeof cryptoIcons;
  const size = number("size", 128);
  const colorValue = color("color", theme.colors.primary.c100);

  const TagName = cryptoIcons[name] || "BTC";

  return <TagName color={colorValue} size={size} />;
};

storiesOf((story) =>
  story("Icon", module).add("Crypto Icons", IconSample).add("Single Crypto Icon", SingleCryptoIcon),
);
