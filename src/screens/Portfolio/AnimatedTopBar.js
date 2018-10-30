// @flow

import React, { PureComponent } from "react";
import {
  StyleSheet,
  Animated,
  View,
  TouchableWithoutFeedback,
  SafeAreaView,
  Platform,
} from "react-native";
import type AnimatedValue from "react-native/Libraries/Animated/src/nodes/AnimatedValue";
import type { Summary } from "../../components/provideSummary";
import extraStatusBarPadding from "../../logic/extraStatusBarPadding";
import { scrollToTopIntent } from "./events";
import BalanceHeader from "./BalanceHeader";
import HeaderErrorTitle from "../../components/HeaderErrorTitle";
import HeaderSynchronizing from "../../components/HeaderSynchronizing";

class AnimatedTopBar extends PureComponent<{
  scrollY: AnimatedValue,
  summary: Summary,
  pending: boolean,
  error: ?Error,
}> {
  onPress = () => {
    scrollToTopIntent.next();
  };

  render() {
    const { scrollY, summary, pending, error } = this.props;

    const opacity = scrollY.interpolate({
      inputRange: [90, 150],
      outputRange: [0, 1],
      extrapolate: "clamp",
    });

    return (
      <TouchableWithoutFeedback onPress={this.onPress}>
        <Animated.View style={[styles.root, { opacity }]}>
          <View style={[styles.outer, { paddingTop: extraStatusBarPadding }]}>
            <SafeAreaView>
              {pending ? (
                <View style={styles.content}>
                  <HeaderSynchronizing />
                </View>
              ) : error ? (
                <View style={styles.content}>
                  <HeaderErrorTitle error={error} />
                </View>
              ) : (
                <BalanceHeader summary={summary} />
              )}
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
    zIndex: 2,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    ...Platform.select({
      android: {
        elevation: 1,
      },
      ios: {
        shadowOpacity: 0.03,
        shadowRadius: 8,
        shadowOffset: {
          height: 4,
        },
      },
    }),
  },
  outer: {
    overflow: "hidden",
  },
  content: {
    justifyContent: "center",
    paddingVertical: 8,
    height: 56,
  },
});

export default AnimatedTopBar;
