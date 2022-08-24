import { lightTheme } from "./src/colors";

declare module "@react-navigation/native" {
  export type ExtendedTheme = typeof lightTheme;
  export function useTheme(): ExtendedTheme;
}

// For image imports
declare module "*.png" {
  const value: any;
  export = value;
}
