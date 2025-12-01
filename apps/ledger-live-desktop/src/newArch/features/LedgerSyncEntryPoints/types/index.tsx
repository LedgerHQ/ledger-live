import { AnalyticsPage } from "../../WalletSync/hooks/useLedgerSyncAnalytics";

export enum EntryPoint {
  onboarding = "onboarding",
  postOnboarding = "postOnboarding",
  manager = "manager",
  accounts = "accounts",
  settings = "settings",
}

export type EntryPointsData = Record<
  keyof typeof EntryPoint,
  {
    enabled: boolean;
    page: AnalyticsPage;
    onClick: () => void;
    variant?: "illustration" | "neutralIcon";
    component: ({
      onPress,
      variant,
    }: {
      onPress: () => void;
      variant?: "illustration" | "neutralIcon";
    }) => JSX.Element;
  }
>;
