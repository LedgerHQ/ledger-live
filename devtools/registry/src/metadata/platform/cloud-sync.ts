import { Category, type ToolMetadata } from "../../types";
export type { CloudSyncDevToolProps } from "@devtools/cloud-sync";

export const cloudSync: ToolMetadata = {
  label: "Cloud Sync",
  category: Category.DEBUGGING,
  owner: "Platform",
  desc: "Pull, push, listen, and destroy the Ledger Sync cloud document.",
  loader: () => import("@devtools/cloud-sync"),
};
