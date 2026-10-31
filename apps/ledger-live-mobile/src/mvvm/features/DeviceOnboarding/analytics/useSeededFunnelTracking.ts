import { useEffect } from "react";
import {
  seededChecksPage,
  seededFunnel,
  seededPages,
  toFirmwareUpdateAvailability,
} from "./seededTracking";

type Input = Readonly<{
  machineState: string | null;
  /** The machine context as plain data, as the onboarding session exposes it. */
  context: Readonly<Record<string, unknown>> | null | undefined;
  offerSync: boolean;
}>;

/** Feeds the seeded funnel from the checks machine. Does nothing for an unseeded entry. */
export function useSeededFunnelTracking({ machineState, context, offerSync }: Input) {
  const seeded = context?.onboardedOnEntry === true;
  const deviceType = readString(context?.deviceModelId) ?? "";
  const firmwareCheck = readFirmwareCheck(context);
  const page = seeded
    ? seededChecksPage(
        machineState,
        context?.checksPaused === true,
        readString(context?.genuineFailureKind),
      )
    : null;

  useEffect(() => seededFunnel.reset(), []);

  useEffect(() => {
    if (seeded) seededFunnel.learn({ seeded, deviceType, ledgerSyncEligible: offerSync });
  }, [seeded, deviceType, offerSync]);

  useEffect(() => {
    if (!seeded || firmwareCheck === null) return;
    seededFunnel.learn({
      firmwareUpdateAvailability: toFirmwareUpdateAvailability(firmwareCheck),
    });
    seededFunnel.start();
  }, [seeded, firmwareCheck]);

  useEffect(() => {
    if (!page) return;
    if (page === seededPages.osUpdateRequired) seededFunnel.page(seededPages.genuineCheckSuccess);
    seededFunnel.page(page);
  }, [page]);
}

function readFirmwareCheck(context: Input["context"]): string | null {
  if (readString(context?.availableFirmwareVersion)) return "offered";
  if (context?.firmwareChecked === true) return "checked";
  return null;
}

function readString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}
