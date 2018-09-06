// @flow

import React, { PureComponent } from "react";
import { StyleSheet, Animated } from "react-native";
import { translate } from "react-i18next";

import type AnimatedValue from "react-native/Libraries/Animated/src/nodes/AnimatedValue";

import colors from "../../colors";
import type { T } from "../../types/common";

import LText from "../../components/LText";
import Space from "../../components/Space";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import { getElevationStyle } from "../../components/ElevatedView";

import type { Summary } from "../../components/provideSummary";

class AnimatedTopBar extends PureComponent<{
  scrollY: AnimatedValue,
  summary: Summary,
  t: T,
}> {
  render() {
    const { scrollY, summary, t } = this.props;

    const opacity = scrollY.interpolate({
      inputRange: [0, 100],
      outputRange: [0, 1],
      extrapolate: "clamp",
    });

    const translateY = scrollY.interpolate({
      inputRange: [0, 120],
      outputRange: [60, 0],
      extrapolate: "clamp",
    });

    return (
      <Animated.View style={[getElevationStyle(20), styles.root, { opacity }]}>
        <Animated.View style={[styles.inner, { transform: [{ translateY }] }]}>
          <LText secondary style={styles.labelText}>
            {t("common:portfolio.totalBalance")}
          </LText>
          <Space h={5} />
          <LText tertiary style={styles.balanceText}>
            <CurrencyUnitValue
              unit={summary.counterValueCurrency.units[0]}
              value={summary.balanceEnd.value}
            />
          </LText>
        </Animated.View>
      </Animated.View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    backgroundColor: "white",
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  inner: {
    alignItems: "center",
    justifyContent: "center",
  },
  labelText: {
    fontSize: 14,
    color: colors.grey,
  },
  balanceText: {
    fontSize: 16,
    color: colors.darkBlue,
  },
});

export default translate()(AnimatedTopBar);
