/* @flow */

import React, { PureComponent } from "react";
import { RectButton } from "react-native-gesture-handler";
import {
  StyleSheet,
  ActivityIndicator,
  View,
  Animated,
  TouchableOpacity,
} from "react-native";
import type { ViewStyleProp } from "react-native/Libraries/StyleSheet/StyleSheet";
import { useTheme } from "@react-navigation/native";
import LText from "./LText";
import ButtonUseTouchable from "../context/ButtonUseTouchable";
import { track } from "../analytics";

const WAIT_TIME_BEFORE_SPINNER = 150;
const BUTTON_HEIGHT = 48;
const ANIM_OFFSET = 20;
const ANIM_DURATION = 300;

type LTextProps = React$ElementProps<typeof LText>;
type LTextStyleProp = $PropertyType<LTextProps, "style">;

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
  titleStyle?: LTextStyleProp,
  IconLeft?: React$ComponentType<{ size: number, color: string }>,
  IconRight?: React$ComponentType<{ size: number, color: string }>,
  disabled?: boolean,
  outline?: boolean,
  // for analytics
  event: string,
  eventProperties?: Object,
  size?: number,
};

type Props = BaseButtonProps & {
  useTouchable: boolean,
  colors: *,
};

const ButtonWrapped = (props: BaseButtonProps) => {
  const { colors } = useTheme();
  return (
    <ButtonUseTouchable.Consumer>
      {useTouchable => (
        <Button {...props} useTouchable={useTouchable} colors={colors} />
      )}
    </ButtonUseTouchable.Consumer>
  );
};

class Button extends PureComponent<
  Props,
  {
    pending: boolean,
    spinnerOn: boolean,
    anim: Animated.Value,
  },
> {
  static defaultProps = {
    outline: true,
  };

  state = {
    pending: false,
    spinnerOn: false,
    anim: new Animated.Value(0),
  };

  timeout: *;

  unmounted = false;

  componentWillUnmount() {
    clearTimeout(this.timeout);
    this.unmounted = true;
  }

  onPress = async () => {
    const { onPress, event, eventProperties } = this.props;
    if (!onPress) return;
    if (event) {
      track(event, eventProperties);
    }
    let isPromise;
    try {
      const res = onPress();
      isPromise = !!res && !!res.then;
      if (isPromise) {
        // it's a promise, we will use pending/spinnerOn state
        this.setState({ pending: true });
        this.timeout = setTimeout(() => {
          this.setState(({ pending, spinnerOn }) => {
            if (spinnerOn || !pending) return null;
            return { spinnerOn: true };
          });

          Animated.spring(this.state.anim, {
            toValue: 1,
            duration: ANIM_DURATION,
            useNativeDriver: true,
          }).start();
        }, WAIT_TIME_BEFORE_SPINNER);
        await res;
      }
    } finally {
      if (isPromise) {
        clearTimeout(this.timeout);
        if (!this.unmounted) {
          this.setState(({ pending }) =>
            pending ? { pending: false, spinnerOn: false } : null,
          );

          Animated.spring(this.state.anim, {
            toValue: 0,
            duration: ANIM_DURATION,
            useNativeDriver: true,
          }).start();
        }
      }
    }
  };

  render() {
    const {
      // required props
      title,
      onPress,
      titleStyle,
      IconLeft,
      IconRight,
      disabled,
      type,
      useTouchable,
      outline,
      // everything else
      containerStyle,
      colors,
      ...otherProps
    } = this.props;

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

    const { pending, anim } = this.state;
    const isDisabled = disabled || !onPress || pending;

    const needsBorder =
      (type === "secondary" ||
        type === "tertiary" ||
        type === "darkSecondary") &&
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
      outputRange: [0, -ANIM_OFFSET],
    });

    const titleOpacity = anim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0],
    });

    const spinnerSliderOffset = anim.interpolate({
      inputRange: [0, 1],
      outputRange: [ANIM_OFFSET, 0],
    });

    const titleSliderStyle = [
      styles.slider,
      {
        opacity: titleOpacity,
        transform: [{ translateY: titleSliderOffset }],
      },
    ];

    const spinnerSliderStyle = [
      styles.spinnerSlider,
      {
        opacity: anim,
        transform: [{ translateY: spinnerSliderOffset }],
      },
    ];

    const Container = useTouchable
      ? disabled
        ? View
        : TouchableOpacity
      : RectButton;
    const containerSpecificProps = useTouchable ? {} : { enabled: !isDisabled };

    return (
      // $FlowFixMe
      <Container
        onPress={isDisabled ? undefined : this.onPress}
        style={mainContainerStyle}
        {...containerSpecificProps}
        {...otherProps}
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
          <ActivityIndicator color={theme.disabledTitle.color} />
        </Animated.View>
      </Container>
    );
  }
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

export default ButtonWrapped;
