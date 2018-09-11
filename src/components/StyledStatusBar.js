// @flow

import React, { Component } from "react";
import { StatusBar, Platform } from "react-native";
import Color from "color";

type Props = {
  hidden?: boolean,
  animated?: boolean,
  backgroundColor?: string,
  translucent?: boolean,
  barStyle?: "default" | "light-content" | "dark-content",
  networkActivityIndicatorVisible?: boolean,
  showHideTransition?: "fade" | "slide",
  transparent?: "light-content" | "dark-content",
};

const OSType =
  Platform.OS === "ios"
    ? "ios"
    : Platform.Version < 23
      ? "oldAndroid"
      : "newAndroid";

class StyledStatusBar extends Component<Props> {
  render() {
    const { transparent, backgroundColor, ...restProps } = this.props;
    const styledProps: Props = {};

    if (OSType !== "ios") {
      // Make the app content go behind the status bar on Android
      styledProps.translucent = !!transparent;
    }

    if (transparent) {
      if (OSType !== "oldAndroid") {
        styledProps.barStyle = transparent; // Apply dark or light style to bar content
      }

      styledProps.backgroundColor =
        OSType === "oldAndroid" && transparent === "light-content"
          ? "rgba(0, 0, 0, 0.5)" // Old Androids are stuck with light status bar content, so translucent dark background for you
          : "transparent"; // Full transparency elsewhere
    } else if (backgroundColor) {
      const color = Color(backgroundColor);

      if (OSType === "oldAndroid" && color.isLight()) {
        // Darken the bar on old Androids if too light to keep readability
        styledProps.backgroundColor = color
          .lightness(50)
          .rgb()
          .toString();
      }

      if (OSType === "newAndroid") {
        styledProps.backgroundColor = backgroundColor;
      }

      if (OSType !== "oldAndroid") {
        // Change the bar content color on other OSes
        styledProps.barStyle = color.isLight()
          ? "dark-content"
          : "light-content";
      }
    }

    return <StatusBar {...restProps} {...styledProps} />;
  }
}

export default StyledStatusBar;
