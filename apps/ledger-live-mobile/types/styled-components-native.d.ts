declare module "styled-components/native" {
  import { ComponentType } from "react";

  // Theme interface to reduce 'any' types
  export interface DefaultTheme {
    colors: any;
    space: any;
    radii: any;
    sizes: any;
    fontSizes: any;
    zIndexes: any;
    theme: any;
    [key: string]: any;
  }

  // Props with theme for template literals
  interface ThemedProps {
    theme?: DefaultTheme;
    [key: string]: any;
  }

  // Template literal function type
  type TemplateFunction<P = {}> = (props: ThemedProps & P) => string | number;

  // Styled component result type
  interface StyledComponent<P = {}> {
    attrs<T>(attrs: T | ((props: ThemedProps & P) => T)): StyledComponent<P & T>;
    (strings: TemplateStringsArray, ...interpolations: (string | number | TemplateFunction<P>)[]): ComponentType<P>;
  }

  interface StyledInterface {
    <C extends ComponentType<any>>(component: C): StyledComponent<any>;
    <C extends ComponentType<any>, P = {}>(component: C): StyledComponent<P>;
    View: StyledComponent;
    Text: StyledComponent;
    TouchableOpacity: StyledComponent;
    ScrollView: StyledComponent;
    FlatList: StyledComponent;
    SafeAreaView: StyledComponent;
    TextInput: StyledComponent;
    [key: string]: StyledComponent;
  }

  // Main styled function
  const styled: StyledInterface;
  export default styled;

  export const ThemeProvider: ComponentType<{ theme: DefaultTheme; children: React.ReactNode }>;
  export function useTheme(): DefaultTheme;
}