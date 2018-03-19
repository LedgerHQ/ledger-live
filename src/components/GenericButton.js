/* @flow */

import React, { Component } from "react";
import {
  TouchableOpacity,
  View,
  StyleSheet,
  ActivityIndicator
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
    titleStyle: ?*
  },
  {
    pending: boolean,
    spinnerOn: boolean
  }
> {
  state = {
    pending: false,
    spinnerOn: false
  };
  onPress = async () => {
    let timeout;
    try {
      const res = this.props.onPress();
      if (res && res.then) {
        // it's a promise, we will use pending/spinnerOn state
        this.setState({ pending: true });
        timeout = setTimeout(() => {
          this.setState(({ pending, spinnerOn }) => {
            if (spinnerOn || !pending) return null;
            return { spinnerOn: true };
          });
        }, WAIT_TIME_BEFORE_SPINNER);
        await res;
      }
    } finally {
      clearTimeout(timeout);
      this.setState(
        ({ pending }) => (pending ? { pending: false, spinnerOn: false } : null)
      );
    }
  };
  render() {
    const {
      onPress,
      title,
      containerStyle,
      titleStyle,
      spinnerColor
    } = this.props;
    const { pending, spinnerOn } = this.state;
    const disabled = !onPress || pending;
    return (
      <TouchableOpacity onPress={this.onPress} disabled={disabled}>
        <View
          style={[
            styles.container,
            disabled ? styles.containerDisabled : null,
            containerStyle
          ]}
        >
          <LText style={[styles.title, titleStyle]}>{title}</LText>
          {spinnerOn && spinnerColor ? (
            <ActivityIndicator
              color={spinnerColor}
              style={{ position: "absolute" }}
            />
          ) : null}
        </View>
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10
  },
  containerDisabled: {
    opacity: 0.5
  },
  title: {}
});
