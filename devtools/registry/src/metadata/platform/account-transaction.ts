import { Category, type ToolMetadata } from "../../types";
export type { AccountTransactionToolProps } from "@devtools/account-transaction";

export const accountTransaction: ToolMetadata = {
  label: "Account Transaction",
  category: Category.ACCOUNTS,
  owner: "platform",
  desc: "Prepare, estimate fees, sign and broadcast a send from an account",
  loader: () => import("@devtools/account-transaction"),
  platform: "web",
};
