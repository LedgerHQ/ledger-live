import { Platform } from "react-native";

export function getStepIconId(stepId: string): string {
  if (stepId !== "apple-google-pay") return stepId;
  return Platform.OS === "ios" ? "Apple" : "Android";
}
