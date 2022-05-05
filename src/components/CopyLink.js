// @flow

import React, { PureComponent } from "react";
import { StyleSheet } from "react-native";
import Clipboard from "@react-native-community/clipboard";
import { Icons, Text } from "@ledgerhq/native-ui";
import Touchable from "./Touchable";
import { withTheme } from "../colors";

type Props = {
  style?: *,
  children: string | React$Element<*>,
  string: string, // String to be copied
  replacement?: string | React$Element<*>, // String to display in place of children on copy
  colors: *,
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
        <Icons.CopyMedium
          size={16}
          color={copied ? "neutral.c70" : "primary.c80"}
        />
        <Text
          variant="body"
          fontWeight="semiBold"
          color={copied ? "neutral.c70" : "primary.c80"}
          ml={3}
        >
          {copied && replacement ? replacement : children}
        </Text>
      </Touchable>
    );
  }

  componentWillUnmount() {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
  }
}

export default withTheme(CopyLink);

const styles = StyleSheet.create({
  linkContainer: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  linkText: {
    marginLeft: 6,
  },
});
