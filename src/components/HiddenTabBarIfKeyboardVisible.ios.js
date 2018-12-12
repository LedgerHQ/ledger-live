// @flow
import React from "react";
import { BottomTabBar } from "react-navigation-tabs";

export default class HiddenTabBarIfKeyboardVisible extends React.PureComponent<
  *,
  *,
> {
  render() {
    return <BottomTabBar {...this.props} />;
  }
}
