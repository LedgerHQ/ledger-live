import { Category, ToolKind, type ToolMetadata } from "../../types";

export type { AccountDetailToolProps } from "@devtools/account-detail";

export const accountDetail: ToolMetadata = {
  label: "account-detail",
  kind: ToolKind.FEATURE,
  category: Category.FEATURES_AND_FLOWS,
  owner: "Wallet XP",
  desc: "Debug the Account Detail page: reset its Analytics card so it shows again.",
  loader: () =>
    import("@devtools/account-detail").then(({ AccountDetail }) => ({ default: AccountDetail })),
};
