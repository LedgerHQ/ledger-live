// @flow

import React, { PureComponent } from "react";
import { StyleSheet, Share } from "react-native";
import Icon from "react-native-vector-icons/dist/Feather";
import Touchable from "./Touchable";
import LText from "./LText";
import colors from "../colors";

type Props = {
  children: React$Node,
  value: string, // String to be shared
};

class ShareLink extends PureComponent<Props> {
  onPress = async () => {
    const { value } = this.props;
    await Share.share({
      message: value,
    });
  };

  render() {
    const { children } = this.props;

    return (
      <Touchable
        event="ShareLink"
        style={styles.linkContainer}
        onPress={this.onPress}
      >
        <Icon name="share" size={16} color={colors.live} />
        <LText style={[styles.linkText]} semiBold>
          {children}
        </LText>
      </Touchable>
    );
  }
}

export default ShareLink;

const styles = StyleSheet.create({
  linkContainer: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  linkText: {
    color: colors.live,
    marginLeft: 6,
  },
});
