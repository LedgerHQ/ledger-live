import { Category, type ToolMetadata } from "../../types";
export type { TrustchainDevToolProps } from "@devtools/trustchain";

export const trustchain: ToolMetadata = {
  label: "Trustchain",
  category: Category.DEBUGGING,
  owner: "Platform",
  desc: "Inspect the app's LKRP trustchain state and exercise all SDK methods (mock or real device).",
  loader: () => import("@devtools/trustchain"),
};
