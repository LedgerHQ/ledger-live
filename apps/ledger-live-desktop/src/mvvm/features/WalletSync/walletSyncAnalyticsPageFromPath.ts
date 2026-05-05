import { AnalyticsPage } from "LLD/features/WalletSync/hooks/useLedgerSyncAnalytics";

/** Ledger Sync activation analytics context — keep in sync with legacy per-screen drawers. */
export function walletSyncAnalyticsPageFromPath(pathname: string): AnalyticsPage {
  if (pathname.startsWith("/settings")) return AnalyticsPage.SettingsGeneral;
  if (pathname.startsWith("/accounts")) return AnalyticsPage.Accounts;
  if (pathname.startsWith("/manager")) return AnalyticsPage.Manager;
  if (pathname.startsWith("/sync-onboarding")) return AnalyticsPage.OnboardingSync;
  if (pathname.startsWith("/onboarding")) return AnalyticsPage.Onboarding;
  if (pathname.startsWith("/post-onboarding")) return AnalyticsPage.PostOnboarding;
  return AnalyticsPage.PostOnboarding;
}
