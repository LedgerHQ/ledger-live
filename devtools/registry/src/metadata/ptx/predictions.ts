import { Category, type ToolMetadata } from "../../types";
export type { PredictionsToolProps } from "@devtools/predictions";

export const predictions: ToolMetadata = {
  label: "Predictions",
  category: Category.FEATURES_AND_FLOWS,
  owner: "PTX",
  desc: "Inspect and reset what the Predictions onboarding stored, and preview the trading wallet setup.",
  loader: () => import("@devtools/predictions"),
};
