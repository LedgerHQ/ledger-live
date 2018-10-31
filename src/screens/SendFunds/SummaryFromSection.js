/* @flow */
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import type { Account } from "@ledgerhq/live-common/lib/types";
import SummaryRowCustom from "./SummaryRowCustom";
import Circle from "../../components/Circle";
import LText from "../../components/LText";
import CurrencyIcon from "../../components/CurrencyIcon";
import Wallet from "../../icons/Wallet";

import colors from "../../colors";

type Props = {
  account: Account,
};
export default class SummaryFromSection extends PureComponent<Props> {
  render() {
    const { account } = this.props;
    return (
      <SummaryRowCustom
        label="From"
        iconLeft={
          <Circle bg={colors.lightLive} size={34}>
            <Wallet size={16} color={colors.live} />
          </Circle>
        }
        data={
          <View style={{ flexDirection: "row" }}>
            <View style={styles.currencyIcon}>
              <CurrencyIcon size={14} currency={account.currency} />
            </View>
            <LText
              numberOfLines={1}
              ellipsizeMode="tail"
              style={styles.summaryRowText}
            >
              {account.name}
            </LText>
          </View>
        }
      />
    );
  }
}
const styles = StyleSheet.create({
  summaryRowText: {
    fontSize: 16,
    textAlign: "right",
    color: colors.darkBlue,
  },
  currencyIcon: {
    paddingRight: 8,
    justifyContent: "center",
  },
});
