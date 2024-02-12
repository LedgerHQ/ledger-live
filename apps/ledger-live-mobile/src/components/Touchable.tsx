import React, { Component } from "react";
import { GestureResponderEvent, TouchableOpacity, TouchableOpacityProps } from "react-native";
import { track } from "~/analytics";

const defaultHitSlop = {
  // default & can be overridden by rest
  top: 16,
  left: 16,
  right: 16,
  bottom: 16,
};
export type Props = {
  // when on press returns a promise,
  // the button will toggle in a pending state and
  // will wait the promise to complete before enabling the button again
  // it also displays a spinner if it takes more than WAIT_TIME_BEFORE_SPINNER
  onPress?: (() => (Promise<unknown> | null | undefined) | void) | null;
  onLongPress?: ((event?: GestureResponderEvent) => void) | undefined;
  children: React.ReactNode;
  event?: string;
  eventProperties?: Record<string, unknown>;
  style?: TouchableOpacityProps["style"];
  touchableTestID?: string;
} & TouchableOpacityProps;
export default class Touchable extends Component<
  Props,
  {
    pending: boolean;
  }
> {
  state = {
    pending: false,
  };
  unmounted = false;

  componentWillUnmount() {
    this.unmounted = true;
  }

  onPress = async () => {
    const { onPress, event, eventProperties } = this.props;
    if (!onPress) return;

    try {
      if (event) {
        track(event, eventProperties);
      }

      const res = onPress();

      if (res && res instanceof Promise) {
        // it's a promise, we will use pending/spinnerOn state
        this.setState({
          pending: true,
        });
        await res;
      }
    } finally {
      if (!this.unmounted) {
        this.setState(({ pending }) =>
          pending
            ? {
                pending: false,
              }
            : null,
        );
      }
    }
  };
  onLongPress = async () => {
    const { onLongPress, event, eventProperties } = this.props;
    if (!onLongPress) return;

    if (event) {
      track(event, eventProperties);
    }

    const res = onLongPress();
    this.setState({
      pending: true,
    });
    await res;
    this.setState({
      pending: false,
    });
  };

  render() {
    const { onPress, children, event, eventProperties, touchableTestID, ...rest } = this.props;
    const { pending } = this.state;
    const disabled = !onPress || pending;

    return (
      <TouchableOpacity
        delayPressIn={50}
        onPress={this.onPress}
        disabled={disabled}
        hitSlop={defaultHitSlop}
        testID={touchableTestID ?? event}
        {...rest}
      >
        {children}
      </TouchableOpacity>
    );
  }
}
