import { useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  SeedPath,
  type DeviceOnboardingContext,
  type FirmwareCheck,
} from "@features/platform-device-onboarding";
import {
  onboardingPages,
  setupPage,
  setupSuccessPages,
  toFirmwareUpdateAvailability,
  trackOnboardingPage,
  trackUnseededSetupFinished,
  trackUnseededStarted,
  unseededProps,
  type FirmwareUpdateAvailability,
  type FunnelProps,
  type OnboardingPage,
  type TrackingProps,
  type UnseededStatus,
} from "@features/platform-device-onboarding-analytics";
import { checksPage } from "./checksPage";

type Input = Readonly<{
  /** The state the screen shows, so a held screen (device locked or off) sends no page again. */
  machineState: string | null;
  machineContext: DeviceOnboardingContext | null;
}>;

export type UnseededFunnel = Readonly<{ props: FunnelProps; status: UnseededStatus }>;

/** States that pass between two setup steps: the setup is not over while one shows. */
const statesBetweenSteps = new Set([
  "readingState",
  "routing",
  "deviceLocked",
  "awaitingSession",
  "awaitingSessionAfterFirmwareUpdate",
]);

/** Sent by the checks error drawers, not from the machine state. */
const pagesSentElsewhere = new Set<OnboardingPage>([
  onboardingPages.genuineCheckRefused,
  onboardingPages.genuineCheckError,
]);

type ShownPage = Readonly<{ page: OnboardingPage; extraProps?: TrackingProps }>;

function checksResultPage(
  machineState: string,
  context: DeviceOnboardingContext,
  status: UnseededStatus,
): ShownPage | null {
  const page = checksPage(
    machineState,
    context.checksPaused,
    context.lastGenuineFailure?.kind ?? null,
  );
  const availability = { firmware_update_availability: status.firmwareUpdateAvailability };
  // The update sheets send the OS update pages: the screen behind them is the genuine success.
  if (page === onboardingPages.osUpdateRequired) {
    return { page: onboardingPages.genuineCheckSuccess, extraProps: availability };
  }
  if (page === onboardingPages.checksSuccess) {
    const upToDate = context.firmware?.kind === "upToDate";
    return {
      page: upToDate ? onboardingPages.checksSuccess : onboardingPages.genuineCheckSuccess,
      extraProps: availability,
    };
  }
  return page ? { page } : null;
}

export function unseededShownPage(
  machineState: string,
  context: DeviceOnboardingContext,
  status: UnseededStatus,
): ShownPage | null {
  if (machineState.startsWith("checks.")) return checksResultPage(machineState, context, status);
  const page = setupPage(machineState);
  return page ? { page } : null;
}

/** The legacy flow, the bootloader and a quit while reading leave before the funnel starts. */
function isFunnelState(machineState: string): boolean {
  return (
    machineState === "awaitingStart" ||
    machineState.startsWith("checks.") ||
    machineState.startsWith("deviceSetup.")
  );
}

function setupFinished(machineState: string, context: DeviceOnboardingContext): boolean {
  return (
    context.lastDeviceState?.isOnboarded === true &&
    !machineState.startsWith("deviceSetup.") &&
    !statesBetweenSteps.has(machineState)
  );
}

const availabilityRank = { unknown: 0, no: 1, yes: 2 } as const;

/** The machine forgets its firmware check after an update and on each new session. */
function useKnownFirmwareAvailability(
  firmwareKind: FirmwareCheck["kind"] | null,
): FirmwareUpdateAvailability {
  const seen = toFirmwareUpdateAvailability(firmwareKind, false);
  const [known, setKnown] = useState(seen);
  const best = availabilityRank[seen] > availabilityRank[known] ? seen : known;
  if (best !== known) setKnown(best);
  return best;
}

/** Rebuilt only when a field it reads changes, so the props keep their identity between polls. */
function useStableFunnel(context: DeviceOnboardingContext | null): UnseededFunnel | null {
  const unseeded = context?.onboardedOnEntry === false;
  const deviceModelId = context?.deviceModelId ?? null;
  const seedPath = context?.seedPath ?? null;
  const offerSync = context?.offerSync === true;
  const firmwareUpdateAvailability = useKnownFirmwareAvailability(context?.firmware?.kind ?? null);

  return useMemo(() => {
    if (!unseeded || !deviceModelId) return null;
    return {
      props: unseededProps(deviceModelId, seedPath),
      status: { ledgerSyncEligible: offerSync, firmwareUpdateAvailability },
    };
  }, [unseeded, deviceModelId, seedPath, offerSync, firmwareUpdateAvailability]);
}

/**
 * Sends the pages and milestones of the unseeded funnel, from the machine state it shows.
 * Returns null unless the device was not seeded on entry.
 */
export function useUnseededFunnelTracking({
  machineState,
  machineContext,
}: Input): UnseededFunnel | null {
  const funnel = useStableFunnel(machineContext);
  const started = useRef(false);
  const finished = useRef(false);
  const recoveryKeyOffered = useRef(false);
  const lastPage = useRef<OnboardingPage | null>(null);
  const sentOnce = useRef(new Set<OnboardingPage>());

  // Runs before the passive effects, so `onboarding_started` goes before the karaoke page.
  useLayoutEffect(() => {
    if (!funnel || !machineState || !machineContext) return;
    const { props, status } = funnel;
    const sendOnce = (page: OnboardingPage) => {
      if (sentOnce.current.has(page)) return;
      sentOnce.current.add(page);
      trackOnboardingPage(page, props);
    };

    if (!started.current && isFunnelState(machineState)) {
      started.current = true;
      trackUnseededStarted(props, status);
    }

    const recoveryKeyAfterNewSeed =
      machineState === "deviceSetup.backupRecoveryKey" &&
      machineContext.seedPath === SeedPath.NewSeed;
    if (recoveryKeyAfterNewSeed) sendOnce(onboardingPages.newSeedSuccess);

    const shown = unseededShownPage(machineState, machineContext, status);
    if (shown && shown.page !== lastPage.current) {
      lastPage.current = shown.page;
      if (shown.page === onboardingPages.recoveryKeyStart) recoveryKeyOffered.current = true;
      if (!pagesSentElsewhere.has(shown.page)) {
        trackOnboardingPage(shown.page, props, shown.extraProps);
      }
    }

    if (started.current && !finished.current && setupFinished(machineState, machineContext)) {
      finished.current = true;
      setupSuccessPages(
        machineContext.seedPath,
        machineContext.lastDeviceState?.recoveryKeyStatus ?? null,
        recoveryKeyOffered.current,
      ).forEach(sendOnce);
      trackUnseededSetupFinished(props, status);
    }
  }, [funnel, machineState, machineContext]);

  return funnel;
}
