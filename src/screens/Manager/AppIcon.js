// @flow
import React, { PureComponent } from "react";
import { Image } from "react-native";
import manager from "../../logic/manager";

type Props = {
  icon: string,
  size: number,
};

class AppIcon extends PureComponent<Props> {
  static defaultProps = {
    size: 38,
  };

  render() {
    const { size } = this.props;
    const uri = manager.getIconUrl(this.props.icon);
    return <Image source={{ uri }} style={{ width: size, height: size }} />;
  }
}

export default AppIcon;
