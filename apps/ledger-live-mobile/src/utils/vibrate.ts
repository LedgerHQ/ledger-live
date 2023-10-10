import { Vibration } from "react-native";

const VIBRATION_ERROR = [0, 150];

export const vibration = {
  error: () => Vibration.vibrate(VIBRATION_ERROR),
};
