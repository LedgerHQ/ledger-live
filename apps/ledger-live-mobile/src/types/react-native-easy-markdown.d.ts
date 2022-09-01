declare module "react-native-easy-markdown" {
  type Props = {
    useDefaultStyles?: boolean;
    markdownStyles?: Record<string, unknown>;
    parseInline?: boolean;
    debug?: boolean;
    style?: Record<string, unknown>;
    // Add additional props if needed here.
    // See: https://github.com/TitanInvest/react-native-easy-markdown#props
  };
  declare const Markdown: React.ComponentType<Props>;
  export default Markdown;
}
