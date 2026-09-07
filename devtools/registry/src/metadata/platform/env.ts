import { Category, type ToolMetadata } from "../../types";
export type { EnvDevToolProps } from "@devtools/env";

export const env: ToolMetadata = {
  label: "Environment",
  category: Category.CONFIGURATION,
  owner: "Platform",
  desc: "View and override all @shared/env variables at runtime.",
  loader: () => import("@devtools/env"),
};
