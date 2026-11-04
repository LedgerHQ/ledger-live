import { Category, ToolKind, type ToolMetadata } from "../../types";

export type { AccountAnalyticsIntroductionToolProps } from "@devtools/account-analytics-introduction";

export const accountAnalyticsIntroduction: ToolMetadata = {
  label: "account-analytics-introduction",
  kind: ToolKind.FEATURE,
  category: Category.FEATURES_AND_FLOWS,
  owner: "Wallet XP",
  desc: "Reset the Account Detail card that redirects to Analytics so it shows again.",
  loader: () =>
    import("@devtools/account-analytics-introduction").then(({ AccountAnalyticsIntroduction }) => ({
      default: AccountAnalyticsIntroduction,
    })),
};
