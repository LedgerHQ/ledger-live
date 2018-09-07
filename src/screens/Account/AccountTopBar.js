// @flow

import React, { PureComponent } from "react";
import { StyleSheet, Animated, View } from "react-native";

import type { Account } from "@ledgerhq/live-common/lib/types";
import type { NavigationScreenProp } from "react-navigation";
import type AnimatedValue from "react-native/Libraries/Animated/src/nodes/AnimatedValue";

import colors from "../../colors";

import LText from "../../components/LText";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import CurrencyIcon from "../../components/CurrencyIcon";
import { getElevationStyle } from "../../components/ElevatedView";
import IconWrench from "../../images/icons/Wrench";
import IconArrowLeft from "../../images/icons/ArrowLeft";

import AccountTopBarAction from "./AccountTopBarAction";

class AccountTopBar extends PureComponent<{
  account: Account,
  navigation: NavigationScreenProp<{ accountId: string }>,
  scrollY: AnimatedValue,
}> {
  onEditSettings = () => {
    const { navigation } = this.props;
    navigation.navigate("AccountSettings", {
      // $FlowFixMe
      accountId: navigation.state.params.accountId,
    });
  };

  onBack = () => {
    this.props.navigation.navigate("Accounts");
  };

  render() {
    const { scrollY, account } = this.props;

    const nameScale = scrollY.interpolate({
      inputRange: [0, 120],
      outputRange: [1, 0.7],
      extrapolate: "clamp",
    });

    const nameTranslateY = scrollY.interpolate({
      inputRange: [0, 120],
      outputRange: [20, 0],
      extrapolate: "clamp",
    });

    const balanceTranslateY = scrollY.interpolate({
      inputRange: [0, 120],
      outputRange: [100, 10],
      extrapolate: "clamp",
    });

    return (
      <Animated.View style={[getElevationStyle(5), styles.root]}>
        {/* BACK BUTTON */}
        <AccountTopBarAction Icon={IconArrowLeft} onPress={this.onBack} />

        <View style={styles.main}>
          {/* ACCOUNT NAME */}
          <Animated.View
            style={[
              styles.nameContainer,
              {
                transform: [
                  { scale: nameScale },
                  { translateY: nameTranslateY },
                ],
              },
            ]}
          >
            <View style={styles.iconContainer}>
              <CurrencyIcon size={18} currency={account.currency} />
            </View>
            <LText
              semiBold
              secondary
              numberOfLines={1}
              ellipsizeMode="tail"
              style={styles.nameText}
            >
              {account.name}
            </LText>
          </Animated.View>

          {/* BALANCE */}
          <Animated.View
            style={[
              styles.balanceContainer,
              {
                transform: [{ translateY: balanceTranslateY }],
              },
            ]}
          >
            <LText
              tertiary
              numberOfLines={1}
              ellipsizeMode="tail"
              style={styles.balanceText}
            >
              <CurrencyUnitValue unit={account.unit} value={account.balance} />
            </LText>
          </Animated.View>
        </View>

        {/* SETTINGS BUTTON */}
        <AccountTopBarAction Icon={IconWrench} onPress={this.onEditSettings} />
      </Animated.View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    backgroundColor: colors.white,
    overflow: "hidden",
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    justifyContent: "center",
    flexDirection: "row",
  },
  main: {
    flexGrow: 1,
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  nameText: {
    fontSize: 16,
    color: colors.darkBlue,
  },
  iconContainer: {
    marginRight: 8,
    justifyContent: "center",
  },
  balanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  balanceText: {
    fontSize: 16,
    color: colors.darkBlue,
  },
});

export default AccountTopBar;
