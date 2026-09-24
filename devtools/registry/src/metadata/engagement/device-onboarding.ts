import { Category, type ToolMetadata } from "../../types";
export type { DeviceOnboardingToolProps } from "@devtools/device-onboarding";

export const deviceOnboarding: ToolMetadata = {
  label: "Device Onboarding",
  category: Category.FEATURES_AND_FLOWS,
  owner: "Engagement",
  desc: "Run the shared device onboarding flow against a real device.",
  loader: () => import("@devtools/device-onboarding"),
};
