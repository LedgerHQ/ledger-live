// See: https://reactnative.dev/docs/hermes#confirming-hermes-is-in-use
// eslint-disable-next-line no-var, vars-on-top
declare var HermesInternal: string;

// For image imports
declare module "*.png";
declare module "*.jpg";
declare module "*.jpeg";
declare module "*.webp";

// For Lottie/DotLottie asset (Metro resolves to asset id number)
declare module "*.lottie" {
  const value: number;
  export default value;
}
