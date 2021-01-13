// @flow

import React, { useState } from "react";
import {
  StyleSheet,
  View,
  TouchableWithoutFeedback,
  Platform,
} from "react-native";
import Animated from "react-native-reanimated";
import type AnimatedValue from "react-native/Libraries/Animated/src/nodes/AnimatedValue";
import { useSafeArea } from "react-native-safe-area-context";
import type { Portfolio, Currency } from "@ledgerhq/live-common/lib/types";
import { useTheme } from "@react-navigation/native";
import extraStatusBarPadding from "../../logic/extraStatusBarPadding";
import BalanceHeader from "./BalanceHeader";
import HeaderErrorTitle from "../../components/HeaderErrorTitle";
import HeaderSynchronizing from "../../components/HeaderSynchronizing";
import { scrollToTop } from "../../navigation/utils";

type Props = {
  scrollY: AnimatedValue,
  portfolio: Portfolio,
  counterValueCurrency: Currency,
  pending: boolean,
  error: ?Error,
};

const { call, cond, interpolate, lessThan, useCode } = Animated;

export default function AnimatedTopBar({
  scrollY,
  portfolio,
  counterValueCurrency,
  pending,
  error,
}: Props) {
  const { colors } = useTheme();
  const { top } = useSafeArea();
  const [isShown, setIsShown] = useState(false);

  const opacity = interpolate(scrollY, {
    inputRange: [90, 150],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  useCode(
    () =>
      cond(
        lessThan(scrollY, 90),
        call([], () => {
          setIsShown(false);
        }),
        call([], () => {
          setIsShown(true);
        }),
      ),
    [isShown],
  );

  const contentStyle = [
    styles.content,
    { height: Platform.OS === "ios" ? top + 56 : 56 },
  ];

  return (
    <Animated.View
      style={[styles.root, { opacity, backgroundColor: colors.card }]}
      pointerEvents={isShown ? "auto" : "none"}
    >
      <TouchableWithoutFeedback onPress={scrollToTop}>
        <View style={[styles.outer, { paddingTop: extraStatusBarPadding }]}>
          <View>
            {pending ? (
              <View style={[...contentStyle, { marginBottom: 8 }]}>
                <HeaderSynchronizing />
              </View>
            ) : error ? (
              <View style={contentStyle}>
                <HeaderErrorTitle error={error} />
              </View>
            ) : (
              <BalanceHeader
                counterValueCurrency={counterValueCurrency}
                portfolio={portfolio}
                style={contentStyle}
              />
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
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
    justifyContent: "flex-end",
    paddingVertical: 8,
  },
});
