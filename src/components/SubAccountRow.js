// @flow
import {
  getAccountCurrency,
  getAccountName,
  getAccountUnit,
} from "@ledgerhq/live-common/lib/account";
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import {
  RectButton,
  LongPressGestureHandler,
  State,
} from "react-native-gesture-handler";
import type {
  SubAccount,
  TokenAccount,
  Account,
} from "@ledgerhq/live-common/lib/types";
import { createStructuredSelector } from "reselect";
import { connect } from "react-redux";
import LText from "./LText";
import CurrencyUnitValue from "./CurrencyUnitValue";
import CounterValue from "./CounterValue";
import CurrencyIcon from "./CurrencyIcon";
import colors from "../colors";
import { accountSelector } from "../reducers/accounts";

type Props = {
  account: SubAccount,
  parentAccount: Account,
  onSubAccountPress: SubAccount => *,
  onSubAccountLongPress: (TokenAccount, Account) => *,
};

const placeholderProps = {
  width: 40,
  containerHeight: 20,
};

class SubAccountRow extends PureComponent<Props> {
  render() {
    const {
      account,
      parentAccount,
      onSubAccountPress,
      onSubAccountLongPress,
    } = this.props;

    const currency = getAccountCurrency(account);
    const name = getAccountName(account);
    const unit = getAccountUnit(account);

    return (
      <LongPressGestureHandler
        onHandlerStateChange={({ nativeEvent }) => {
          if (nativeEvent.state === State.ACTIVE) {
            if (account.type === "TokenAccount") {
              onSubAccountLongPress(account, parentAccount);
            }
          }
        }}
        minDurationMs={600}
      >
        <RectButton
          style={styles.container}
          underlayColor={colors.grey}
          onPress={() => onSubAccountPress(account)}
        >
          <View accessible style={styles.innerContainer}>
            <CurrencyIcon size={24} currency={currency} />
            <View style={styles.inner}>
              <LText semiBold numberOfLines={1} style={styles.accountNameText}>
                {name}
              </LText>
            </View>
            <View style={styles.balanceContainer}>
              <LText tertiary style={styles.balanceNumText}>
                <CurrencyUnitValue
                  showCode
                  unit={unit}
                  value={account.balance}
                />
              </LText>
              <View style={styles.balanceCounterContainer}>
                <CounterValue
                  showCode
                  currency={currency}
                  value={account.balance}
                  withPlaceholder
                  placeholderProps={placeholderProps}
                  Wrapper={AccountCv}
                />
              </View>
            </View>
          </View>
        </RectButton>
      </LongPressGestureHandler>
    );
  }
}

const AccountCv = ({ children }: { children: * }) => (
  <LText tertiary style={styles.balanceCounterText}>
    {children}
  </LText>
);

const mapStateToProps = createStructuredSelector({
  parentAccount: accountSelector,
});

export default connect(mapStateToProps)(SubAccountRow);

const styles = StyleSheet.create({
  container: {
    borderRadius: 4,
  },
  innerContainer: {
    paddingHorizontal: 12,
    paddingVertical: 14,
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
