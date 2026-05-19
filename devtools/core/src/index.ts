import { ComponentType } from "react";

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

export const FEATURE_FLAGS_ID = parse("feature-flags");

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface DevToolsPropsRegistry {}

const TOOL_ID = Symbol("ToolId");
export type ToolId = string & { [TOOL_ID]: "ToolId" };

export function parse(id: string): ToolId {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return id as ToolId;
}

export function isToolId(id: string): id is ToolId {
  return typeof id === "string";
}

export function createTool<K extends ToolId>(descriptor: Tool<K>): Tool<K> {
  return descriptor;
}

export type ToolPlatform = "web" | "native";

export interface Tool<K extends ToolId = ToolId> {
  id: K;
  label: string;
  category: Category;
  owner?: string;
  desc?: string;
  icon?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: ComponentType<any>;
  platform?: ToolPlatform;
  optional?: boolean;
}

export type ToolDescriptor<K extends ToolId = ToolId> = Tool<K>;

export type ToolLoader = () => Promise<{ default: Tool }>;
export type ToolLoaders = Partial<Record<ToolId, ToolLoader>>;
