import { AnalyticsPage } from "../../WalletSync/hooks/useLedgerSyncAnalytics";

export enum EntryPoint {
  onboarding = "onboarding",
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
    component: ({ onPress }: { onPress: () => void }) => JSX.Element;
  }
>;
