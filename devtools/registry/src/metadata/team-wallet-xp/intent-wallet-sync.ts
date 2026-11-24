import { Category, type ToolMetadata } from "../../types";
export type { IntentWalletSyncToolProps } from "@devtools/intent-wallet-sync";

export const intentWalletSync: ToolMetadata = {
  label: "Ledger Sync intents",
  category: Category.DEBUGGING,
  owner: "wallet-xp",
  desc: "Launch the Ledger Sync add and remove member intents on the Device Intent Executor and log every job state.",
  loader: () => import("@devtools/intent-wallet-sync"),
};
