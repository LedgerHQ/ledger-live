import type { ComponentType } from "react";
import type { DevToolsPropsRegistry } from "./index";

export type ToolPlatform = "web" | "native";

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
  id: keyof DevToolsPropsRegistry;
  label: string;
  category: Category;
  owner?: string;
  desc?: string;
  icon?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: ComponentType<any>;
  platform?: "web" | "native";
  optional?: boolean;
}
