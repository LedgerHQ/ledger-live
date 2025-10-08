import React from "react";
import debounce from "lodash/debounce"; // 4.0.8
import { PressableProps } from "react-native";

export const withPreventDoubleClick = <Props extends { onPress?: PressableProps["onPress"] }>(
  WrappedComponent: React.ComponentType<Props>,
) => {
  class PreventDoubleClick extends React.PureComponent<Props> {
    debouncedOnPress = (...args: OnPressParams) => {
      this.props?.onPress?.(...args);
    };

    onPress = debounce(this.debouncedOnPress, 300, {
      leading: true,
      trailing: false,
    });
    static displayName: string;

    render() {
      return <WrappedComponent {...this.props} onPress={this.onPress} />;
    }
  }

  PreventDoubleClick.displayName = `withPreventDoubleClick(${
    WrappedComponent.displayName || WrappedComponent.name
  })`;
  return PreventDoubleClick;
};

type OnPressParams = Parameters<NonNullable<PressableProps["onPress"]>>;
