declare module "react-native-easy-markdown" {
  import { ComponentType } from "react";
  import { ViewStyle, TextStyle } from "react-native";

  export interface MarkdownProps {
    markdown: string;
    style?: ViewStyle;
    textStyle?: TextStyle;
    markdownStyles?: Record<string, unknown>;
  }

  const Markdown: ComponentType<MarkdownProps>;
  export default Markdown;
}
