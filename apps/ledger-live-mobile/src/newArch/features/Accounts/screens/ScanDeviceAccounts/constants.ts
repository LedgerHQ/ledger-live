import { Easing } from "react-native";

const ANIMATION_DURATION = 200;

export const ANIMATION_TIMEOUT = 125;

export const sharedAnimationConfiguration = {
  duration: ANIMATION_DURATION,
  useNativeDriver: true,
  easing: Easing.in(Easing.cubic),
};
