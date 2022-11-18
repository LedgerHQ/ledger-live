declare module "react-native-slider" {
  type Props = {
    value?: number;
    disabled?: boolean;
    minimumValue?: number;
    maximumValue?: number;
    step: number;
    minimumTrackTintColor?: string;
    maximumTrackTintColor?: string;
    thumbTintColor?: string;
    thumbTouchSize?: {
      width: number;
      a;
      height: number;
    };
    onValueChange?: (_: string | number) => void;
    onSlidingStart?: (_: string | number) => void;
    onSlidingComplete?: (_: string | number) => void;
    style?: StyleProp<ViewStyle>;
    trackStyle?: StyleProp<ViewStyle>;
    thumbStyle?: StyleProp<ViewStyle>;
    thumbImage?: unknown;
    debugTouchArea?: boolean;
    animateTransitions?: boolean;
    animationType?: "spring" | "timing";
    animationConfig?: Record<string, unknown>;
  };
  declare const Slider: React.ComponentType<Props>;
  export default Slider;
}
