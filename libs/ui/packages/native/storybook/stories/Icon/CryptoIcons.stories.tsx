import React from "react";
import { View } from "react-native";
import { ComponentStory } from "@storybook/react-native";
import { CryptoIcons } from "../../../src/assets";
import { BTC, ETH, DOT } from "../../../src/assets/cryptoIcons";
import { useTheme } from "styled-components/native";
import * as cryptoIcons from "@ledgerhq/crypto-icons-ui/native";
import CryptoIcon from "../../../src/components/Icon/CryptoIcon";

export default {
  title: "Icon/CryptoIcon",
  component: CryptoIcon,
};

export const IconSample = () => (
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
IconSample.storyName = "Crypto Icons";

export const SingleCryptoIcon: ComponentStory<typeof CryptoIcon> = (
  args: typeof SingleCryptoIconArgs,
) => {
  const theme = useTheme();
  const name = args.name;
  const size = args.size;
  const colorValue = args.color ?? theme.colors.primary.c100;

  const disabled = args.disabled;
  const circleIcon = args.circleIcon;

  const tokenIcon = args.tokenIcon;

  return (
    <CryptoIcon
      name={name}
      size={size}
      color={colorValue}
      disabled={disabled}
      circleIcon={circleIcon}
      tokenIcon={tokenIcon}
    />
  );
};
SingleCryptoIcon.storyName = "Single Crypto Icon";
const SingleCryptoIconArgs = {
  name: "BTC",
  size: 128,
  color: undefined,
  disabled: false,
  circleIcon: false,
  tokenIcon: "",
};
SingleCryptoIcon.args = SingleCryptoIconArgs;
SingleCryptoIcon.argTypes = {
  name: {
    options: Object.keys(cryptoIcons),
    control: { type: "select" },
  },
};
