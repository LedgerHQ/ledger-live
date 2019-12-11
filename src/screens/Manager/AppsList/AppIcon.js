// @flow
import React, { PureComponent } from "react";
import { Image } from "react-native";
import manager from "@ledgerhq/live-common/lib/manager";

type Props = {
  icon: string,
  size: number,
};

export default class AppIcon extends PureComponent<Props> {
  static defaultProps = {
    size: 38,
  };

  render() {
    const { size } = this.props;
    const uri = manager.getIconUrl(this.props.icon);
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size }}
        fadeDuration={0}
      />
    );
  }
}