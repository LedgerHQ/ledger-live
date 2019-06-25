// @flow
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import { RectButton } from "react-native-gesture-handler";
import type { TokenAccount } from "@ledgerhq/live-common/lib/types";
import LText from "./LText";
import CurrencyUnitValue from "./CurrencyUnitValue";
import CounterValue from "./CounterValue";
import CurrencyIcon from "./CurrencyIcon";
import colors from "../colors";

type Props = {
  account: TokenAccount,
  nested: boolean,
  onTokenAccountPress: TokenAccount => *,
};

const placeholderProps = {
  width: 40,
  containerHeight: 20,
};

class TokenRow extends PureComponent<Props> {
  render() {
    const {
      account,
      account: { token },
      onTokenAccountPress,
    } = this.props;

    return (
      <View style={styles.root}>
        <RectButton onPress={() => onTokenAccountPress(account)}>
          <View accessible style={styles.innerContainer}>
            <CurrencyIcon size={24} currency={token} />
            <View style={styles.inner}>
              <LText
                semiBold
                numberOfLines={1}
                ellipsizeMode="middle"
                style={styles.accountNameText}
              >
                {token.name}
              </LText>
            </View>
            <View style={styles.balanceContainer}>
              <LText tertiary style={styles.balanceNumText}>
                <CurrencyUnitValue
                  showCode
                  unit={token.units[0]}
                  value={account.balance}
                />
              </LText>
              <View style={styles.balanceCounterContainer}>
                <CounterValue
                  showCode
                  currency={token}
                  value={account.balance}
                  withPlaceholder
                  placeholderProps={placeholderProps}
                  Wrapper={AccountCv}
                />
              </View>
            </View>
          </View>
        </RectButton>
      </View>
    );
  }
}

const AccountCv = ({ children }: { children: * }) => (
  <LText tertiary style={styles.balanceCounterText}>
    {children}
  </LText>
);

export default TokenRow;

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.white,
  },
  innerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    overflow: "visible",
  },
  inner: {
    flexGrow: 1,
    flexShrink: 1,
    marginLeft: 16,
    flexDirection: "column",
  },
  accountNameText: {
    color: colors.darkBlue,
    fontSize: 16,
    marginBottom: 4,
  },
  balanceContainer: {
    marginLeft: 16,
    alignItems: "flex-end",
  },
  balanceNumText: {
    fontSize: 16,
    color: colors.darkBlue,
  },
  balanceCounterContainer: {
    marginTop: 5,
    height: 20,
  },
  balanceCounterText: {
    fontSize: 14,
    color: colors.grey,
  },
});
