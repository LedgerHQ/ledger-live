import { useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  reportsSetupDone,
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
  /** False while another screen (the Recover Live App) is in front: its pages wait until then. */
  focused: boolean;
}>;

export type UnseededFunnel = Readonly<{ props: FunnelProps; status: UnseededStatus }>;

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

/** The OS update an unseeded Nano held back until setup: its sheets and drawers send their own pages. */
const postSetupFirmwareCheck = "postSetupFirmware.firmwareCheck";

export function unseededShownPage(
  machineState: string,
  context: DeviceOnboardingContext,
  status: UnseededStatus,
): ShownPage | null {
  if (machineState.startsWith("checks.")) return checksResultPage(machineState, context, status);
  if (machineState === postSetupFirmwareCheck) return { page: onboardingPages.checkOsVersion };
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

/**
 * A setup exit, or a device that reports its setup done: after a session change the deferred
 * update goes back to the checks. Not `isOnboarded`, which a Recovery Key backup already reports.
 */
function setupFinished(machineState: string, context: DeviceOnboardingContext): boolean {
  return (
    machineState === "setupExit" ||
    machineState === "done" ||
    machineState.startsWith("postSetupFirmware.") ||
    reportsSetupDone(context.lastDeviceState, context.recoveryKeyBackupOpen)
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

/** The device restarted its setup: the abandoned attempt must not decide the new one's pages. */
function isSetupForgotten(context: DeviceOnboardingContext): boolean {
  return context.seedPath === null && context.currentSetupStep === null;
}

function isRecoveryKeyAfterNewSeed(machineState: string, context: DeviceOnboardingContext) {
  return machineState === "deviceSetup.backupRecoveryKey" && context.seedPath === SeedPath.NewSeed;
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
  focused,
}: Input): UnseededFunnel | null {
  const funnel = useStableFunnel(machineContext);
  const started = useRef(false);
  const finished = useRef(false);
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

    if (isSetupForgotten(machineContext) && !finished.current) sentOnce.current.clear();

    if (!started.current && isFunnelState(machineState)) {
      started.current = true;
      trackUnseededStarted(props, status);
    }

    if (isRecoveryKeyAfterNewSeed(machineState, machineContext)) {
      sendOnce(onboardingPages.newSeedSuccess);
    }

    const shown = unseededShownPage(machineState, machineContext, status);
    if (focused && shown && shown.page !== lastPage.current) {
      lastPage.current = shown.page;
      if (!pagesSentElsewhere.has(shown.page)) {
        trackOnboardingPage(shown.page, props, shown.extraProps);
      }
    }

    if (started.current && !finished.current && setupFinished(machineState, machineContext)) {
      finished.current = true;
      setupSuccessPages(
        machineContext.seedPath,
        machineContext.lastDeviceState?.recoveryKeyStatus ?? null,
      ).forEach(sendOnce);
      trackUnseededSetupFinished(props, status);
    }
  }, [funnel, machineState, machineContext, focused]);

  return funnel;
}
