// @flow
import React, { PureComponent } from "react";
import { Animated, View, StyleSheet } from "react-native";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import type { Account } from "@ledgerhq/live-common/lib/types";
import LText from "../../components/LText";
import Card from "../../components/Card";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import CounterValue from "../../components/CounterValue";
import CurrencyIcon from "../../components/CurrencyIcon";
import colors from "../../colors";
import { isUpToDateAccountSelector } from "../../reducers/accounts";
import { accountSyncStateSelector } from "../../reducers/bridgeSync";
import type { AsyncState } from "../../reducers/bridgeSync";

const mapStateToProps = createStructuredSelector({
  syncState: accountSyncStateSelector,
  isUpToDateAccount: isUpToDateAccountSelector,
});

type Props = {
  account: Account,
  syncState: AsyncState,
  style?: any,
  isUpToDateAccount: boolean,
  navigation: *,
};

type State = {
  errorValue: Animated.Value,
  pendingValue: Animated.Value,
};

const TICK_W = 6;
const TICK_H = 20;

class AccountRow extends PureComponent<Props, State> {
  state = {
    errorValue: new Animated.Value(this.props.syncState.error ? 1 : 0),
    pendingValue: new Animated.Value(this.props.syncState.pending ? 1 : 0),
  };

  onPress = () => {
    this.props.navigation.navigate("Account", {
      accountId: this.props.account.id,
    });
  };

  componentDidUpdate(old) {
    const { syncState, isUpToDateAccount } = this.props;
    if (!old.syncState.error !== !syncState.error) {
      Animated.timing(this.state.errorValue, {
        toValue: syncState.error ? 1 : 0,
        useNativeDriver: true,
        duration: 1000,
      }).start();
    }
    if (!old.isUpToDateAccount !== !isUpToDateAccount) {
      Animated.timing(this.state.pendingValue, {
        toValue: !isUpToDateAccount ? 1 : 0,
        useNativeDriver: true,
        duration: 1000,
      }).start();
    }
  }

  render() {
    const { account, style } = this.props;
    const { errorValue, pendingValue } = this.state;
    return (
      <Card onPress={this.onPress} style={[styles.root, style]}>
        <Animated.View
          style={[
            styles.tickError,
            styles.tick,
            {
              opacity: errorValue,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.tickPending,
            styles.tick,
            {
              opacity: pendingValue,
            },
          ]}
        />
        <CurrencyIcon size={24} currency={account.currency} />
        <View style={styles.accountName}>
          <LText semiBold numberOfLines={2} style={styles.accountNameText}>
            {account.name}
          </LText>
        </View>
        <View style={styles.balanceContainer}>
          <LText tertiary style={styles.balanceNumText}>
            <CurrencyUnitValue
              showCode
              unit={account.unit}
              value={account.balance}
            />
          </LText>
          <View style={styles.balanceCounterContainer}>
            <LText tertiary style={styles.balanceCounterText}>
              <CounterValue
                showCode
                currency={account.currency}
                value={account.balance}
              />
            </LText>
          </View>
        </View>
      </Card>
    );
  }
}

export default connect(mapStateToProps)(AccountRow);

const styles = StyleSheet.create({
  root: {
    marginBottom: 10,
    flexDirection: "row",
    paddingHorizontal: 16,
    alignItems: "center",
    height: 72,
    overflow: "visible",
  },
  accountName: {
    flexGrow: 1,
    flexShrink: 1,
    marginLeft: 16,
  },
  accountNameText: {
    color: colors.darkBlue,
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
  },
  balanceCounterText: {
    fontSize: 14,
    color: colors.smoke,
  },
  tickError: {
    backgroundColor: colors.alert,
  },
  tickPending: {
    backgroundColor: colors.fog,
  },
  tick: {
    position: "absolute",
    left: -TICK_W + 1, // +1 is hack for android. it would disappear otherwise^^
    width: TICK_W,
    height: TICK_H,
  },
});
