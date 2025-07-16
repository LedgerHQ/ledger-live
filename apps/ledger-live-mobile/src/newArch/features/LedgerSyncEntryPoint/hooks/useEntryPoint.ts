import { useSelector } from "react-redux";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { trustchainSelector } from "@ledgerhq/ledger-key-ring-protocol/store";
import { lastSeenDeviceSelector } from "~/reducers/settings";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { track } from "~/analytics";
import { EntryPoint, EntryPointsData } from "../types";
import CtaEntryPoint from "../components/CtaEntryPoint";
import CardEntryPoint from "../components/CardEntryPoint";

export function useEntryPoint(entryPoint: EntryPoint) {
  const featureLedgerSyncEntryPoints = useFeature("llmLedgerSyncEntryPoints");
  const featureWalletSync = useFeature("llmWalletSync");
  const trustchain = useSelector(trustchainSelector);
  const lastSeenDevice = useSelector(lastSeenDeviceSelector);

  const isLedgerSyncEnabled = featureWalletSync?.enabled ?? false;
  const areEntryPointsEnabled = featureLedgerSyncEntryPoints?.enabled ?? false;
  const isLedgerSyncActivated = Boolean(trustchain && trustchain?.rootId);
  const isDeviceEligible =
    lastSeenDevice !== null && lastSeenDevice.modelId !== DeviceModelId.nanoS;

  const ctaEntryPoint = {
    onClick: ({ page }: { page: string }) => {
      track("button_clicked", { button: "Activate Ledger Sync", page });
    },
    component: CtaEntryPoint,
  };
  const cardEntryPoint = {
    onClick: ({ page }: { page: string }) => {
      track("banner_clicked", { banner: "Ledger Sync Activation", page });
    },
    component: CardEntryPoint,
  };

  const entryPointsData: EntryPointsData = {
    [EntryPoint.manager]: {
      enabled: featureLedgerSyncEntryPoints?.params?.manager ?? false,
      ...cardEntryPoint,
    },
    [EntryPoint.accounts]: {
      enabled: featureLedgerSyncEntryPoints?.params?.accounts ?? false,
      ...ctaEntryPoint,
    },
    [EntryPoint.settings]: {
      enabled: featureLedgerSyncEntryPoints?.params?.settings ?? false,
      ...cardEntryPoint,
    },
  };
  const entryPointData = entryPointsData[entryPoint];

  const shouldDisplayAnyEntryPoints =
    isLedgerSyncEnabled && areEntryPointsEnabled && !isLedgerSyncActivated && isDeviceEligible;

  const shouldDisplayEntryPoint = shouldDisplayAnyEntryPoints && entryPointData.enabled;

  return {
    shouldDisplayEntryPoint,
    entryPointData,
  };
}
