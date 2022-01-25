import React, { PureComponent } from "react";
import Icon from "react-native-vector-icons/dist/Feather";

export default class SettingsIcon extends PureComponent<{
  size: number,
  color: string,
}> {
  render() {
    const { size = 16, color } = this.props;
    return <Icon name="settings" size={size} color={color} />;
  }
}
