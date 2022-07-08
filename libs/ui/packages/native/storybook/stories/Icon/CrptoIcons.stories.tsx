import { View } from "react-native";
import { storiesOf } from "../storiesOf";
import React from "react";
import { CryptoIcons } from "../../../src/assets";
import { BTC, ETH, DOT } from "../../../src/assets/cryptoIcons";

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

storiesOf((story) => story("Icon", module).add("Crypto Icons", IconSample));
