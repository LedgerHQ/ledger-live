/* @flow */
import React, { PureComponent } from "react";
import { StyleSheet } from "react-native";
import Markdown from "react-native-easy-markdown";
import LText, { getFontStyle } from "./LText";
import colors from "../colors";

export default class SafeMarkdown extends PureComponent<
  { markdown: string },
  { error: ?Error },
> {
  state = {
    error: null,
  };

  componentDidCatch(error: ?Error) {
    this.setState({ error });
  }

  render() {
    const { markdown } = this.props;
    const { error } = this.state;
    if (error) {
      return <LText style={markdownStyles.text}>{markdown}</LText>; // :(
    }
    return <Markdown markdownStyles={markdownStyles}>{markdown}</Markdown>;
  }
}

const markdownStyles = StyleSheet.create({
  text: {
    ...getFontStyle(),
    color: colors.darkBlue,
    fontSize: 14,
    textAlign: "justify",
  },
  strong: {
    ...getFontStyle({ semiBold: true }),
  },
});
