import React, { PureComponent } from "react";
import Icon from "react-native-vector-icons/dist/Feather";

export default class NoLocationImage extends PureComponent<{
  size: number,
  color: string,
}> {
  render() {
    const { size, color } = this.props;
    return <Icon name="settings" size={size} color={color} />;
  }
}
