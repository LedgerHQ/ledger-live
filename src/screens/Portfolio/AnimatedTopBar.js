// @flow

import React, { PureComponent } from "react";
import {
  StyleSheet,
  Animated,
  View,
  TouchableWithoutFeedback,
  SafeAreaView,
} from "react-native";
import { translate } from "react-i18next";

import type AnimatedValue from "react-native/Libraries/Animated/src/nodes/AnimatedValue";

import colors from "../../colors";
import type { T } from "../../types/common";

import LText from "../../components/LText";
import Space from "../../components/Space";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import { getElevationStyle } from "../../components/ElevatedView";

import type { Summary } from "../../components/provideSummary";

import { scrollToTopIntent } from "./events";

class AnimatedTopBar extends PureComponent<{
  scrollY: AnimatedValue,
  summary: Summary,
  t: T,
}> {
  onPress = () => {
    scrollToTopIntent.next();
  };

  render() {
    const { scrollY, summary, t } = this.props;

    const opacity = scrollY.interpolate({
      inputRange: [140, 240],
      outputRange: [0, 1],
      extrapolate: "clamp",
    });

    return (
      <TouchableWithoutFeedback onPress={this.onPress}>
        <Animated.View style={[getElevationStyle(8), styles.root, { opacity }]}>
          <View style={styles.outer}>
            <SafeAreaView>
              <View style={styles.content}>
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
              </View>
            </SafeAreaView>
          </View>
        </Animated.View>
      </TouchableWithoutFeedback>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  outer: {
    overflow: "hidden",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
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
