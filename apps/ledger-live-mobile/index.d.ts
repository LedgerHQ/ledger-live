// See: https://reactnative.dev/docs/hermes#confirming-hermes-is-in-use
// eslint-disable-next-line no-var, vars-on-top
declare var HermesInternal: string;

// For image imports
declare module "*.png";
declare module "*.jpg";
declare module "*.jpeg";
declare module "*.webp";
declare module "*.lottie" {
  const content: number;
  export default content;
}
declare module "@lottiefiles/dotlottie-react-native" {
  import type React from "react";
  import type { StyleProp, ViewStyle } from "react-native";

  export type DotLottieSource = number | { uri: string };

  export type DotLottieProps = {
    source: DotLottieSource;
    style?: StyleProp<ViewStyle>;
    loop?: boolean;
    autoplay?: boolean;
    speed?: number;
    onComplete?: () => void;
  };

  export const DotLottie: React.ComponentType<DotLottieProps>;
}
