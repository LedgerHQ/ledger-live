// @flow

import React, { PureComponent } from "react";
import { StyleSheet } from "react-native";
import Clipboard from "@react-native-community/clipboard";
import Icon from "react-native-vector-icons/dist/Feather";
import Touchable from "./Touchable";
import LText from "./LText";
import colors from "../colors";

type Props = {
  style?: *,
  children: string | React$Element<*>,
  string: string, // String to be copied
  replacement?: string | React$Element<*>, // String to display in place of children on copy
};

type State = {
  copied: boolean,
};

class CopyLink extends PureComponent<Props, State> {
  state = {
    copied: false,
  };

  timeout = null;

  onPress = () => {
    const { string } = this.props;

    Clipboard.setString(string);

    this.setState({ copied: true });

    this.timeout = setTimeout(() => {
      this.setState({ copied: false });
    }, 3000);
  };

  render() {
    const { style, children, replacement } = this.props;
    const { copied } = this.state;
    return (
      <Touchable
        event="CopyLink"
        style={[styles.linkContainer, style]}
        onPress={this.onPress}
      >
        <Icon
          name="copy"
          size={16}
          color={copied ? colors.grey : colors.live}
        />
        <LText
          style={[styles.linkText, copied ? styles.copied : undefined]}
          semiBold
        >
          {copied && replacement ? replacement : children}
        </LText>
      </Touchable>
    );
  }

  componentWillUnmount() {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
  }
}

export default CopyLink;

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
  copied: {
    color: colors.grey,
  },
});
