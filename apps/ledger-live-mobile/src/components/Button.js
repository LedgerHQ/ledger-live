/* @flow */

import React, {
  useEffect,
  useState,
  useCallback,
  memo,
  useContext,
  useMemo,
} from "react";
import { RectButton } from "react-native-gesture-handler";
import {
  StyleSheet,
  ActivityIndicator,
  View,
  Animated,
  TouchableOpacity,
} from "react-native";
import type { ViewStyleProp } from "react-native/Libraries/StyleSheet/StyleSheet";
import { useTheme, useIsFocused } from "@react-navigation/native";
import Config from "react-native-config";
import LText from "./LText";
import ButtonUseTouchable from "../context/ButtonUseTouchable";
import { track } from "../analytics";

const WAIT_TIME_BEFORE_SPINNER = 150;
const BUTTON_HEIGHT = 48;
const ANIM_OFFSET = 20;
const ANIM_DURATION = 300;

type ButtonType =
  | "primary"
  | "lightPrimary"
  | "negativePrimary"
  | "secondary"
  | "lightSecondary"
  | "darkSecondary"
  | "greySecondary"
  | "tertiary"
  | "alert";

export type BaseButtonProps = {
  type: ButtonType,
  // when on press returns a promise,
  // the button will toggle in a pending state and
  // will wait the promise to complete before enabling the button again
  // it also displays a spinner if it takes more than WAIT_TIME_BEFORE_SPINNER
  onPress?: () => ?Promise<any> | any,
  // text of the button
  title?: React$Node | string,
  containerStyle?: ViewStyleProp,
  titleStyle?: *,
  IconLeft?: React$ComponentType<{ size: number, color: string }>,
  IconRight?: React$ComponentType<{ size: number, color: string }>,
  disabled?: boolean,
  outline?: boolean,
  // for analytics
  event?: string,
  eventProperties?: Object,
  size?: number,
  testID?: string,
  pending?: boolean,
};

type Props = BaseButtonProps & {
  useTouchable: boolean,
  colors: *,
  isFocused: boolean,
};

function ButtonWrapped(props: BaseButtonProps) {
  const { colors } = useTheme();
  const isFocused = useIsFocused(); // @Warning be careful not to import the wrapped button outside of navigation context
  const useTouchable = useContext(ButtonUseTouchable);
  return (
    <BaseButton
      {...props}
      useTouchable={useTouchable}
      colors={colors}
      isFocused={isFocused}
    />
  );
}

export function BaseButton({
  // required props
  title,
  onPress,
  titleStyle,
  IconLeft,
  IconRight,
  disabled,
  type,
  useTouchable,
  outline = true,
  // everything else
  containerStyle,
  event,
  eventProperties,
  pending,
  // $FlowFixMe
  ...otherProps
}: Props) {
  const { colors } = useTheme();
  const [spinnerOn, setSpinnerOn] = useState();
  const [anim] = useState(new Animated.Value(0));

  useEffect(() => {
    setSpinnerOn(pending);
  }, [pending]);

  useEffect(() => {
    if (spinnerOn) {
      Animated.spring(anim, {
        toValue: 1,
        duration: ANIM_DURATION,
        useNativeDriver: true,
        delay: WAIT_TIME_BEFORE_SPINNER,
      }).start();
    } else {
      Animated.spring(anim, {
        toValue: 0,
        duration: ANIM_DURATION,
        useNativeDriver: true,
      }).start();
    }
  }, [spinnerOn, anim]);

  const onPressHandler = useCallback(async () => {
    if (!onPress) return;
    if (event) {
      track(event, eventProperties);
    }
    let isPromise;
    try {
      const res = onPress();
      isPromise = !!res && !!res.then;
      if (isPromise) {
        // it's a promise, we will use pending state
        setSpinnerOn(true);
        await res;
      }
    } finally {
      if (isPromise) {
        setSpinnerOn(false);
      }
    }
  }, [event, eventProperties, onPress]);

  if (__DEV__ && "style" in otherProps) {
    console.warn(
      "Button props 'style' must not be used. Use 'containerStyle' instead.",
    );
  }

  const theme = {
    primaryContainer: { backgroundColor: colors.live },
    primaryTitle: { color: "white" },

    lightPrimaryContainer: { backgroundColor: colors.lightLive },
    lightPrimaryTitle: { color: colors.live },

    negativePrimaryContainer: { backgroundColor: "white" },
    negativePrimaryTitle: { color: colors.live },

    secondaryContainer: { backgroundColor: "transparent" },
    secondaryTitle: { color: colors.grey },
    secondaryOutlineBorder: { borderColor: colors.fog },

    lightSecondaryContainer: { backgroundColor: "transparent" },
    lightSecondaryTitle: { color: colors.live },

    greySecondaryContainer: { backgroundColor: "transparent" },
    greySecondaryTitle: { color: colors.grey },

    darkSecondaryContainer: { backgroundColor: "transparent" },
    darkSecondaryTitle: { color: colors.smoke },
    darkSecondaryOutlineBorder: { borderColor: colors.smoke },

    tertiaryContainer: { backgroundColor: "transparent" },
    tertiaryTitle: { color: colors.live },
    tertiaryOutlineBorder: { borderColor: colors.live },

    alertContainer: { backgroundColor: colors.alert },
    alertTitle: { color: "white" },

    disabledContainer: { backgroundColor: colors.lightFog },
    disabledTitle: { color: colors.grey },
  };

  const isDisabled = disabled || !onPress || spinnerOn;

  const needsBorder =
    (type === "secondary" || type === "tertiary" || type === "darkSecondary") &&
    !isDisabled &&
    outline;

  const mainContainerStyle = [
    styles.container,
    isDisabled ? theme.disabledContainer : theme[`${type}Container`],
    containerStyle,
  ];

  const borderStyle = [styles.outlineBorder, theme[`${type}OutlineBorder`]];

  const textStyle = [
    styles.title,
    titleStyle,
    isDisabled ? theme.disabledTitle : theme[`${type}Title`],
  ];

  const iconColor = isDisabled
    ? theme.disabledTitle.color
    : (theme[`${type}Title`] || {}).color;

  const titleSliderOffset = anim.interpolate({
    inputRange: [0, 1],
    // $FlowFixMe
    outputRange: [0, -ANIM_OFFSET],
  });

  const titleOpacity = anim.interpolate({
    inputRange: [0, 1],
    // $FlowFixMe
    outputRange: [1, 0],
  });

  const spinnerSliderOffset = anim.interpolate({
    inputRange: [0, 1],
    // $FlowFixMe
    outputRange: [ANIM_OFFSET, 0],
  });

  const titleSliderStyle = [
    styles.slider,
    !Config.MOCK
      ? {
          opacity: titleOpacity,
          transform: [{ translateY: titleSliderOffset }],
        }
      : undefined,
  ];

  const spinnerSliderStyle = [
    styles.spinnerSlider,
    !Config.MOCK
      ? {
          opacity: anim,
          transform: [{ translateY: spinnerSliderOffset }],
        }
      : undefined,
  ];

  const Container = useTouchable
    ? disabled
      ? View
      : TouchableOpacity
    : RectButton;
  const containerSpecificProps = useTouchable ? {} : { enabled: !isDisabled };

  function getTestID() {
    // $FlowFixMe
    if (isDisabled || !otherProps.isFocused) return undefined;
    if (otherProps.testID) return otherProps.testID;

    switch (type) {
      case "primary":
        return "Proceed";
      default:
        return event;
    }
  }
  const testID = useMemo(getTestID, [
    isDisabled,
    otherProps.isFocused,
    otherProps.testID,
    event,
    type,
  ]);

  return (
    // $FlowFixMe
    <Container
      onPress={isDisabled ? undefined : onPressHandler}
      style={mainContainerStyle}
      {...containerSpecificProps}
      {...otherProps}
      testID={testID}
    >
      {needsBorder ? <View style={borderStyle} /> : null}

      <Animated.View style={titleSliderStyle}>
        {IconLeft ? (
          <View style={{ paddingRight: title ? 10 : null }}>
            <IconLeft size={16} color={iconColor} />
          </View>
        ) : null}

        {title ? (
          <LText secondary numberOfLines={1} semiBold style={textStyle}>
            {title}
          </LText>
        ) : null}

        {IconRight ? (
          <View style={{ paddingLeft: title ? 10 : null }}>
            <IconRight size={16} color={iconColor} />
          </View>
        ) : null}
      </Animated.View>

      <Animated.View style={spinnerSliderStyle}>
        <ActivityIndicator
          color={theme.disabledTitle.color}
          animating={!Config.MOCK}
        />
      </Animated.View>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    height: BUTTON_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    borderRadius: 4,
    overflow: "hidden",
  },
  slider: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  spinnerSlider: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 16,
  },
  outlineBorder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1.5,
    borderRadius: 4,
  },
});

export default memo<BaseButtonProps>(ButtonWrapped);
