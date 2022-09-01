import React from "react";
import debounce from "lodash/debounce"; // 4.0.8

export const withPreventDoubleClick = <
  Props extends { onPress?: OnPress },
  // eslint-disable-next-line @typescript-eslint/ban-types
  OnPress extends Function,
>(
  WrappedComponent: React.ComponentType<Props>,
) => {
  class PreventDoubleClick extends React.PureComponent<Props> {
    debouncedOnPress = () => {
      this.props.onPress && this.props.onPress();
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
