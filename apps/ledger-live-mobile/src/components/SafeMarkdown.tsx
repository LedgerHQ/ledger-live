import React, { Component, type ReactNode } from "react";
import { StyleSheet } from "react-native";
import Markdown from "@ronradtke/react-native-markdown-display";
import { useTheme } from "@react-navigation/native";
import type { Theme } from "../colors";
import LText, { getFontStyle } from "./LText";

type SafeMarkdownProps = {
  markdown: string;
};

export class MarkdownRenderBoundary extends Component<
  { markdown: string; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <LText style={markdownStyles.text}>{this.props.markdown}</LText>;
    }
    return this.props.children;
  }
}

function SafeMarkdown({ markdown }: SafeMarkdownProps) {
  const { colors } = useTheme() as Theme;
  const textStyle = { ...markdownStyles.text, color: colors.darkBlue };

  return (
    <MarkdownRenderBoundary markdown={markdown}>
      <Markdown
        style={{
          body: textStyle,
          text: textStyle,
          strong: markdownStyles.strong,
        }}
      >
        {markdown}
      </Markdown>
    </MarkdownRenderBoundary>
  );
}

const markdownStyles = StyleSheet.create({
  text: { ...getFontStyle(), fontSize: 14, textAlign: "justify" },
  strong: {
    ...getFontStyle({
      semiBold: true,
    }),
  },
});

export default SafeMarkdown;
