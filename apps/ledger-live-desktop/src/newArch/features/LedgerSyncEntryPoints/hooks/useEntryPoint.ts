import { useSelector } from "react-redux";
import { useHistory } from "react-router";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { trustchainSelector } from "@ledgerhq/ledger-key-ring-protocol/store";
import { lastSeenDeviceSelector } from "~/renderer/reducers/settings";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { track } from "~/renderer/analytics/segment";
import { EntryPoint, EntryPointsData } from "../types";
import OnboardingEntryPoint from "../components/OnboardingEntryPoint";
import ManagerEntryPoint from "../components/ManagerEntryPoint";
import AccountsEntryPoint from "../components/AccountsEntryPoint";
import SettingsEntryPoint from "../components/SettingsEntryPoint";
import { AnalyticsPage } from "../../WalletSync/hooks/useLedgerSyncAnalytics";

export function useEntryPoint(entryPoint: EntryPoint, needEligibleDevice = true) {
  const { push } = useHistory();
  const featureLedgerSyncEntryPoints = useFeature("lldLedgerSyncEntryPoints");
  const featureWalletSync = useFeature("lldWalletSync");
  const trustchain = useSelector(trustchainSelector);
  const lastSeenDevice = useSelector(lastSeenDeviceSelector);

  const isLedgerSyncEnabled = featureWalletSync?.enabled ?? false;
  const areEntryPointsEnabled = featureLedgerSyncEntryPoints?.enabled ?? false;
  const isLedgerSyncActivated = Boolean(trustchain && trustchain?.rootId);
  const isDeviceEligible = Boolean(
    lastSeenDevice && lastSeenDevice.modelId !== DeviceModelId.nanoS,
  );

  const entryPointsData: EntryPointsData = {
    [EntryPoint.onboarding]: {
      enabled: featureLedgerSyncEntryPoints?.params?.onboarding ?? false,
      page: AnalyticsPage.Onboarding,
      onClick: () => {
        track("banner_clicked", { banner: "Ledger Sync Activation", page: "Onboarding" });
      },
      component: OnboardingEntryPoint,
    },
    [EntryPoint.manager]: {
      enabled: featureLedgerSyncEntryPoints?.params?.manager ?? false,
      page: AnalyticsPage.Manager,
      onClick: () => {
        track("banner_clicked", { banner: "Ledger Sync Activation", page: "Manager" });
        push("/settings");
      },
      component: ManagerEntryPoint,
    },
    [EntryPoint.accounts]: {
      enabled: featureLedgerSyncEntryPoints?.params?.accounts ?? false,
      page: AnalyticsPage.Accounts,
      onClick: () => {
        track("banner_clicked", { banner: "Ledger Sync Activation", page: "Accounts" });
        push("/settings");
      },
      component: AccountsEntryPoint,
    },
    [EntryPoint.settings]: {
      enabled: featureLedgerSyncEntryPoints?.params?.settings ?? false,
      page: AnalyticsPage.Settings,
      onClick: () => {
        track("banner_clicked", { banner: "Ledger Sync Activation", page: "Settings" });
      },
      component: SettingsEntryPoint,
    },
  };

  const entryPointData = entryPointsData[entryPoint];

  const shouldDisplayAnyEntryPoints =
    isLedgerSyncEnabled &&
    areEntryPointsEnabled &&
    !isLedgerSyncActivated &&
    (isDeviceEligible || !needEligibleDevice);

  const shouldDisplayEntryPoint = shouldDisplayAnyEntryPoints && entryPointData.enabled;

  return {
    shouldDisplayEntryPoint,
    entryPointData,
  };
}
