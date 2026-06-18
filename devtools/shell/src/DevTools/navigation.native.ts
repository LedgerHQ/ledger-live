import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { Category, ToolId } from "@devtools/registry";

export type DevToolsParamList = {
  categories: undefined;
  tools: { category: Category };
  tool: { toolId: ToolId };
};

export type CategoriesScreenProps = NativeStackScreenProps<DevToolsParamList, "categories">;
export type ToolsScreenProps = NativeStackScreenProps<DevToolsParamList, "tools">;
export type ToolScreenProps = NativeStackScreenProps<DevToolsParamList, "tool">;
