// @flow

import React, { PureComponent } from "react";
import { StatusBar, Platform } from "react-native";
import colors from "../colors";

type Props = {
  hidden?: boolean,
  animated?: boolean,
  backgroundColor?: string,
  translucent?: boolean,
  barStyle?: "default" | "light-content" | "dark-content",
  networkActivityIndicatorVisible?: boolean,
  showHideTransition?: "fade" | "slide",
};

const oldAndroid = Platform.OS === "android" && Platform.Version < 23;

class StyledStatusBar extends PureComponent<Props> {
  static defaultProps = {
    animated: true,
    translucent: true,
    backgroundColor: "transparent",
    barStyle: "dark-content",
  };

  render() {
    const { backgroundColor, ...props } = this.props;
    const newColor =
      oldAndroid && props.barStyle === "dark-content"
        ? colors.live
        : backgroundColor;

    return <StatusBar backgroundColor={newColor} {...props} />;
  }
}

export default StyledStatusBar;
