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
import LText from "./LText";
import ButtonUseTouchable from "../context/ButtonUseTouchable";

import colors from "../colors";

const WAIT_TIME_BEFORE_SPINNER = 150;
const BUTTON_HEIGHT = 48;
const ANIM_OFFSET = 20;
const ANIM_DURATION = 300;

type ButtonType = "primary" | "secondary" | "tertiary" | "alert";

type BaseProps = {
  type: ButtonType,
  // when on press returns a promise,
  // the button will toggle in a pending state and
  // will wait the promise to complete before enabling the button again
  // it also displays a spinner if it takes more than WAIT_TIME_BEFORE_SPINNER
  onPress: () => ?Promise<any> | any,
  // text of the button
  title: string,
  containerStyle?: *,
  titleStyle?: *,
  IconLeft?: *,
  disabled?: boolean,
};

type Props = BaseProps & {
  useTouchable: boolean,
};

const ButtonWrapped = (props: BaseProps) => (
  <ButtonUseTouchable.Consumer>
    {useTouchable => <Button useTouchable={useTouchable} {...props} />}
  </ButtonUseTouchable.Consumer>
);

class Button extends PureComponent<
  Props,
  {
    pending: boolean,
    spinnerOn: boolean,
    anim: Animated.Value,
  },
> {
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
    let isPromise;
    try {
      const res = this.props.onPress();
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
          this.setState(
            ({ pending }) =>
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
      disabled,
      type,
      useTouchable,
      // everything else
      containerStyle,
      ...otherProps
    } = this.props;

    const { pending, anim } = this.state;
    const isDisabled = disabled || !onPress || pending;

    const needsBorder =
      (type === "secondary" || type === "tertiary") && !isDisabled;

    const mainContainerStyle = [
      styles.container,
      isDisabled ? styles.disabledContainer : styles[`${type}Container`],
      containerStyle,
    ];

    const borderStyle = [styles.outlineBorder, styles[`${type}OutlineBorder`]];

    const textStyle = [
      styles.title,
      titleStyle,
      isDisabled ? styles.disabledTitle : styles[`${type}Title`],
    ];

    const iconColor = isDisabled
      ? styles.disabledTitle.color
      : (styles[`${type}Title`] || {}).color;

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
      styles.slider,
      {
        opacity: anim,
        transform: [{ translateY: spinnerSliderOffset }],
      },
    ];

    const Container = useTouchable ? TouchableOpacity : RectButton;
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
            <View style={{ marginRight: 10 }}>
              <IconLeft size={16} color={iconColor} />
            </View>
          ) : null}
          <LText secondary semiBold style={textStyle}>
            {title}
          </LText>
        </Animated.View>

        <Animated.View style={spinnerSliderStyle}>
          <ActivityIndicator color={styles.disabledTitle.color} />
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
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
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
    borderWidth: 2,
    borderRadius: 4,
  },

  // theme

  primaryContainer: { backgroundColor: colors.live },
  primaryTitle: { color: "white" },

  secondaryContainer: { backgroundColor: "transparent" },
  secondaryTitle: { color: colors.grey },
  secondaryOutlineBorder: { borderColor: colors.fog },

  tertiaryContainer: { backgroundColor: "transparent" },
  tertiaryTitle: { color: colors.live },
  tertiaryOutlineBorder: { borderColor: colors.live },

  alertContainer: { backgroundColor: colors.alert },
  alertTitle: { color: "white" },

  disabledContainer: { backgroundColor: colors.lightFog },
  disabledTitle: { color: colors.grey },
});

export default ButtonWrapped;
