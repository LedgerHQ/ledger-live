/* @flow */

import React, { Component } from "react";
import {
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  View,
} from "react-native";
import LText from "./LText";

const WAIT_TIME_BEFORE_SPINNER = 300;

export default class GenericButton extends Component<
  {
    // when on press returns a promise,
    // the button will toggle in a pending state and
    // will wait the promise to complete before enabling the button again
    // it also displays a spinner if it takes more than WAIT_TIME_BEFORE_SPINNER
    onPress: () => ?Promise<any>,
    // if not provided, spinner will be disabled
    spinnerColor?: string,
    // text of the button
    title: string,
    containerStyle: ?*,
    titleStyle: ?*,
    iconLeft?: *,
  },
  {
    pending: boolean,
    spinnerOn: boolean,
  },
> {
  state = {
    pending: false,
    spinnerOn: false,
  };

  timeout: *;

  unmounted = false;

  componentWillUnmount() {
    clearTimeout(this.timeout);
    this.unmounted = true;
  }

  onPress = async () => {
    try {
      const res = this.props.onPress();
      if (res && res.then) {
        // it's a promise, we will use pending/spinnerOn state
        this.setState({ pending: true });
        this.timeout = setTimeout(() => {
          this.setState(({ pending, spinnerOn }) => {
            if (spinnerOn || !pending) return null;
            return { spinnerOn: true };
          });
        }, WAIT_TIME_BEFORE_SPINNER);
        await res;
      }
    } finally {
      clearTimeout(this.timeout);
      if (!this.unmounted) {
        this.setState(
          ({ pending }) =>
            pending ? { pending: false, spinnerOn: false } : null,
        );
      }
    }
  };

  render() {
    const {
      onPress,
      title,
      containerStyle,
      titleStyle,
      spinnerColor,
      iconLeft,
      ...otherProps
    } = this.props;
    const { pending, spinnerOn } = this.state;
    const disabled = !onPress || pending;
    return (
      <TouchableOpacity
        onPress={this.onPress}
        disabled={disabled}
        style={[
          styles.container,
          disabled ? styles.containerDisabled : null,
          containerStyle,
        ]}
        {...otherProps}
      >
        {iconLeft && <View style={{ marginRight: 10 }}>{iconLeft}</View>}
        <LText style={[styles.title, titleStyle]}>{title}</LText>
        {spinnerOn && spinnerColor ? (
          <ActivityIndicator
            color={spinnerColor}
            style={styles.activityIndicator}
          />
        ) : null}
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    height: 40,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  containerDisabled: {
    opacity: 0.5,
  },
  activityIndicator: {
    position: "absolute",
  },
  title: {},
});
