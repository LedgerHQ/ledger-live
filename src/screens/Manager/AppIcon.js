// @flow
import React, { PureComponent } from "react";
import { Image } from "react-native";

const ICONS_FALLBACK = {
  bitcoin_testnet: "bitcoin",
};

// TODO: Move to new ManagerAPI
// When ready, the manager api will return an icon url instead of a name
const getIconUrl = (icon: string): string => {
  const icn = ICONS_FALLBACK[icon] || icon;
  return `https://api.ledgerwallet.com/update/assets/icons/${icn}`;
};

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
    const uri = getIconUrl(this.props.icon);
    return <Image source={{ uri }} style={{ width: size, height: size }} />;
  }
}

export default AppIcon;
