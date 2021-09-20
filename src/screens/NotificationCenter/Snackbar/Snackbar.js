// @flow
import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TouchableHighlight,
} from "react-native";
import Animated, {
  set,
  interpolate,
  Extrapolate,
  useCode,
  Easing,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import { useClock, timing } from "react-native-redash/lib/module/v1";
import type { ToastData } from "@ledgerhq/live-common/lib/notifications/ToastProvider/types";
import { useTheme } from "@react-navigation/native";

import { rgba } from "../../../colors";

import getWindowDimensions from "../../../logic/getWindowDimensions";
import LText from "../../../components/LText";
import Info from "../../../icons/Info";
import Warning from "../../../icons/WarningOutline";
import Close from "../../../icons/Close";

const { width } = getWindowDimensions();

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(
  TouchableHighlight,
);

type Props = {
  toast: ToastData,
  cta?: string,
  onPress: (toast: ToastData) => void,
  onClose?: (toast: ToastData) => void,
};

const icons = {
  info: Info,
  warning: Warning,
};

export default function Snackbar({ toast, cta, onPress, onClose }: Props) {
  const [anim] = useState(new Animated.Value(0));
  const clock = useClock();
  const [closed, setIsClosed] = useState(false);

  useCode(
    () =>
      set(
        anim,
        timing({
          duration: 800,
          easing: Easing.ease,
          clock,
          from: anim,
          to: new Animated.Value(closed ? 0 : 1),
        }),
      ),
    [closed],
  );

  const handleClose = useCallback(() => {
    setIsClosed(true);
    setTimeout(() => onClose && onClose(toast), 1000);
  }, [onClose, toast]);

  const handleOnPress = useCallback(() => {
    onPress(toast);
  }, [onPress, toast]);

  const { colors } = useTheme();

  const { title, type, icon } = toast;

  const iconColors = {
    info: colors.live,
    warning: colors.orange,
  };

  const Icon = icon && icons[icon];
  const iconColor = icon && iconColors[icon];

  const maxHeight = interpolate(anim, {
    inputRange: [0, 0.4, 1],
    outputRange: [0, 200, 200],
    extrapolate: Extrapolate.CLAMP,
  });

  const translateX = interpolate(anim, {
    inputRange: [0, 0.6, 1],
    outputRange: [width + 100, width - 100, 0],
    extrapolate: Extrapolate.CLAMP,
  });

  const opacity = interpolate(anim, {
    inputRange: [0, 0.6, 1],
    outputRange: [0, 0, 1],
    extrapolate: Extrapolate.CLAMP,
  });

  const marginBottom = interpolate(anim, {
    inputRange: [0, 0.4, 1],
    outputRange: [0, 16, 16],
    extrapolate: Extrapolate.CLAMP,
  });

  return (
    <AnimatedTouchableOpacity
      style={[
        styles.root,
        {
          backgroundColor: colors.snackBarBg,
          maxHeight,
          transform: [{ translateX }],
          opacity,
          marginBottom,
        },
      ]}
      onPress={handleOnPress}
      underlayColor={rgba(colors.snackBarBg, 0.8)}
    >
      <View style={styles.container}>
        <View style={styles.leftSection}>
          {Icon && <Icon size={17} color={iconColor} />}
        </View>
        <View style={styles.rightSection}>
          {type && (
            <LText bold style={styles.subTitle} color="grey">
              {type}
            </LText>
          )}
          <View style={styles.horizontal}>
            <LText
              semiBold
              style={[styles.title, { color: colors.snackBarColor }]}
            >
              {title}
            </LText>
            {cta && (
              <LText
                fontSize={3}
                style={[{ color: colors.live }, styles.cta]}
                onPress={handleOnPress}
              >
                {cta}
              </LText>
            )}
          </View>
        </View>
        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Close size={16} color={colors.snackBarColor} />
          </TouchableOpacity>
        )}
      </View>
    </AnimatedTouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: {
    borderRadius: 4,
  },
  container: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  leftSection: { width: 18, marginRight: 14 },
  rightSection: {
    flex: 1,
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },
  title: { fontSize: 14 },
  subTitle: { fontSize: 8, textTransform: "uppercase", letterSpacing: 1.5 },
  closeButton: {
    height: 32,
    width: 32,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    top: 4,
    right: 4,
  },
  horizontal: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  cta: {
    textDecorationLine: "underline",
  },
});
