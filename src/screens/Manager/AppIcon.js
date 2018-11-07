// @flow
import React, { PureComponent } from "react";
import { Image, StyleSheet } from "react-native";

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
};

class AppIcon extends PureComponent<Props> {
  render() {
    const uri = getIconUrl(this.props.icon);

    return <Image source={{ uri }} style={styles.image} />;
  }
}

const styles = StyleSheet.create({
  image: {
    width: 38,
    height: 38,
  },
});

export default AppIcon;
