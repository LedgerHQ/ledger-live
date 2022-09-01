declare module "react-native-redash/lib/module/v1" {
  export * from "react-native-redash/lib/typescript/v1/index";
}

// For image imports
declare module "*.png" {
  const value: any;
  export = value;
}
