import type { ComponentType } from "react";

export enum Category {
  CONFIGURATION = "Configuration",
  FEATURES_AND_FLOWS = "Features & flows",
  CONNECTIVITY = "Connectivity",
  GENERATORS = "Generators",
  DEBUGGING = "Debugging",
  INFORMATION = "Information",
  PERFORMANCE = "Performance",
  PLAYGROUND = "Playground",
}

export interface Tool {
  id: string;
  label: string;
  category: Category;
  owner?: string;
  desc?: string;
  icon?: string;
  component: ComponentType;
}
