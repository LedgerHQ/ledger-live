import { useSelector } from "~/context/hooks";
import { useFeature } from "@features/platform-feature-flags";
import { trustchainSelector } from "@ledgerhq/ledger-key-ring-protocol/store";
import { lastSeenDeviceSelector } from "~/reducers/settings";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { track } from "~/analytics";
import { EntryPoint, EntryPointsData } from "../types";
import CtaEntryPoint from "../components/CtaEntryPoint";
import CardEntryPoint from "../components/CardEntryPoint";
import OptimisedCardEntryPoint from "../components/CardEntryPoint/optimisedCardEntryPoint";
import LedgerSyncBannerV4 from "../components/LedgerSyncBannerV4";

export function useEntryPoint(entryPoint: EntryPoint, variant?: "v4") {
  const featureLedgerSyncEntryPoints = useFeature("llmLedgerSyncEntryPoints");
  const featureWalletSync = useFeature("llmWalletSync");
  const trustchain = useSelector(trustchainSelector);
  const lastSeenDevice = useSelector(lastSeenDeviceSelector);
  const lwmLedgerSyncOptimisation = useFeature("lwmLedgerSyncOptimisation");

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
  const optimisedCardEntryPoint = {
    onClick: ({ page }: { page: string }) => {
      track("banner_clicked", { banner: "Ledger Sync Activation", page });
    },
    component: OptimisedCardEntryPoint,
  };
  const bannerV4EntryPoint = {
    onClick: ({ page }: { page: string }) => {
      track("banner_clicked", { banner: "Ledger Sync Activation", page });
    },
    component: LedgerSyncBannerV4,
  };

  const accountsEntryPoint =
    variant === "v4"
      ? bannerV4EntryPoint
      : lwmLedgerSyncOptimisation?.enabled
        ? optimisedCardEntryPoint
        : ctaEntryPoint;

  const entryPointsData: EntryPointsData = {
    [EntryPoint.manager]: {
      enabled: featureLedgerSyncEntryPoints?.params?.manager ?? false,
      ...(lwmLedgerSyncOptimisation?.enabled ? optimisedCardEntryPoint : cardEntryPoint),
    },
    [EntryPoint.accounts]: {
      enabled: featureLedgerSyncEntryPoints?.params?.accounts ?? false,
      ...accountsEntryPoint,
    },
    [EntryPoint.settings]: {
      enabled: featureLedgerSyncEntryPoints?.params?.settings ?? false,
      ...(lwmLedgerSyncOptimisation?.enabled ? optimisedCardEntryPoint : cardEntryPoint),
    },
    [EntryPoint.onboarding]: {
      enabled: featureLedgerSyncEntryPoints?.params?.onboarding ?? false,
      ...cardEntryPoint,
    },
    [EntryPoint.postOnboarding]: {
      enabled: featureLedgerSyncEntryPoints?.params?.postOnboarding ?? false,
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
