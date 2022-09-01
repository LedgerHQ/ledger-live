import React, { PureComponent } from "react";
import { StyleSheet } from "react-native";
import Clipboard from "@react-native-community/clipboard";
import { Icons, Text } from "@ledgerhq/native-ui";
import Touchable, { Props as TouchableProps } from "./Touchable";
import { withTheme } from "../colors";

type Props = {
  style?: TouchableProps["style"];
  children: string | React.ReactNode;
  /**
   * String to be copied
   */
  string: string;
  /**
   * String to display in place of children on copy
   */
  replacement?: string | React.ReactNode;
  onCopy?: () => void;
};

type State = {
  copied: boolean;
};

class CopyLink extends PureComponent<Props, State> {
  state = {
    copied: false,
  };

  timeout: NodeJS.Timeout | null = null;

  onPress = () => {
    const { string, onCopy } = this.props;

    Clipboard.setString(string);

    this.setState({ copied: true });
    onCopy && onCopy();
    this.timeout = setTimeout(() => {
      this.setState({ copied: false });
    }, 3000);
  };

  render() {
    const { style, children, replacement } = this.props;
    const { copied } = this.state;
    return (
      <Touchable style={[styles.linkContainer, style]} onPress={this.onPress}>
        <Icons.CheckAloneMedium
          size={16}
          color={copied ? "success.c100" : "neutral.c30"}
        />
        <Text
          variant="body"
          fontWeight="semiBold"
          color={copied ? "success.c100" : "primary.c80"}
          ml={2}
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
