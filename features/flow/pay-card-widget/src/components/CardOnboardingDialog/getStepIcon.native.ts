import { getWalletPlatform } from "../getWalletPlatform";

export function getStepIcon(stepId: string): string {
  if (stepId !== "apple-google-pay") return stepId;
  return getWalletPlatform().icon;
}
