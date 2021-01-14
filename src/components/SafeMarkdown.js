/* @flow */
import React, { PureComponent } from "react";
import { StyleSheet } from "react-native";
import Markdown from "react-native-easy-markdown";
import { withTheme } from "../colors";
import LText, { getFontStyle } from "./LText";

class SafeMarkdown extends PureComponent<
  { markdown: string, colors: * },
  { error: ?Error },
> {
  state = {
    error: null,
  };

  componentDidCatch(error: ?Error) {
    this.setState({ error });
  }

  render() {
    const { markdown, colors } = this.props;
    const { error } = this.state;
    if (error) {
      return <LText style={markdownStyles.text}>{markdown}</LText>; // :(
    }
    return (
      <Markdown
        markdownStyles={{
          text: { ...markdownStyles.text, color: colors.darkBlue },
          strong: markdownStyles.strong,
        }}
      >
        {markdown}
      </Markdown>
    );
  }
}

const markdownStyles = StyleSheet.create({
  text: {
    ...getFontStyle(),
    fontSize: 14,
    textAlign: "justify",
  },
  strong: {
    ...getFontStyle({ semiBold: true }),
  },
});

export default withTheme(SafeMarkdown);
