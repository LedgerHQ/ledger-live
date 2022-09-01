declare module "react-native-redash/lib/module/v1" {
  export * from "react-native-redash/lib/typescript/v1/index";
}

// See: https://reactnative.dev/docs/hermes#confirming-hermes-is-in-use
// eslint-disable-next-line no-var, vars-on-top
declare var HermesInternal: string;

// For image imports
declare module "*.png";
