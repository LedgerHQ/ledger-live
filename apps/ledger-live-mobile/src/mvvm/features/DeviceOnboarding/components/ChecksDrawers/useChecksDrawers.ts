import { useCallback, useMemo, useState } from "react";
import { Linking, Platform } from "react-native";
import { track } from "@shared/analytics";
import { getDeviceModel } from "@ledgerhq/devices";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { DeviceModelInfo } from "@ledgerhq/types-live";
import { useLocale } from "~/context/Locale";
import { urls } from "~/utils/urls";
import {
  onboardingButtons,
  onboardingPages,
  withSource,
  type FunnelProps,
  type OnboardingPage,
  type TrackingProps,
} from "@features/platform-device-onboarding-analytics";
import { useInitializerActions } from "LLM/components/DeviceIntentExecutor/ContextInitializer/hooks/useInitializerActions";
import type {
  ChecksScreenState,
  GenuineErrorKind,
  UpdateStep,
} from "LLM/features/DeviceOnboarding/types";
import {
  isBleUpdateSupported,
  isNewFirmwareUpdateUxSupported,
} from "LLM/features/FirmwareUpdate/utils/isFirmwareUpdateSupported";

export type AllowSheetProps = Readonly<{
  deviceModelId: Device["modelId"];
  deviceName: string;
  isOpen: boolean;
  onClose?: () => void;
}>;

export type FirmwareUpdateDrawerProps = Readonly<{
  isOpen: boolean;
  onUpdate: () => void;
  onClose: () => void;
  productName: string;
  firmwareVersion: string;
}>;

export type UnsupportedUpdateDrawerProps = Readonly<{
  isOpen: boolean;
  mounted: boolean;
  onClose: () => void;
  /** The user closed it (header, backdrop or Close button), not code. */
  onClosePressed?: () => void;
  isUsbRequired: boolean;
  productName: string;
}>;

type RecoverableErrorKind = Exclude<GenuineErrorKind, "notGenuine">;

export type DrawerTracking = Readonly<{
  trackName?: string;
  trackCategory?: string;
  trackProps?: TrackingProps;
}>;

export type ErrorDrawerProps = Readonly<{
  tracking: DrawerTracking;
  isOpen: boolean;
  kind: RecoverableErrorKind;
  productName: string;
  onRetry: () => void;
  onCancel: () => void;
  /** Replaces cancel when the failed check is the firmware one the user may skip. */
  onSkip?: () => void;
  onClose: () => void;
  onContactSupport: () => void;
  onGoToSettings: () => void;
}>;

export type NotGenuineDrawerProps = Readonly<{
  tracking: DrawerTracking;
  isOpen: boolean;
  productName: string;
  onClose: () => void;
  /** The user pressed the header close, not code. */
  onClosePressed: () => void;
  onContactSupport: () => void;
}>;

export type ChecksDrawerProps = Readonly<{
  allowSheet: AllowSheetProps;
  firmwareUpdate: FirmwareUpdateDrawerProps;
  unsupportedUpdate: UnsupportedUpdateDrawerProps;
  errorDrawer: ErrorDrawerProps;
  notGenuineDrawer: NotGenuineDrawerProps;
}>;

type OfferedUpdate = { current: string; available: string };

type ChecksErrorDrawersInput = Readonly<{
  device: Device;
  state: ChecksScreenState | null;
  error: { kind: GenuineErrorKind } | null;
  onRetry: () => void;
  onCloseSheet: () => void;
  onErrorCancel: () => void;
  onSkipFirmwareCheck?: () => void;
  onAllowDismiss: () => void;
  onNotGenuineClose: () => void;
  /** Set in a tracked funnel: the drawers then send the funnel page names with these props. */
  funnelProps?: FunnelProps | null;
  suspendSheets?: boolean;
}>;

type FirmwareUpdateRequestInput = Readonly<{
  device: Device;
  update: OfferedUpdate | null;
  onAcceptUpdate: () => void;
  /** Runs on every update tap, before the eligibility check. */
  onUpdatePressed?: () => void;
  /** Runs when the user closes the unsupported-update sheet, not when code hides it. */
  onUnsupportedClosePressed?: () => void;
  suspendSheets?: boolean;
  /**
   * The update an unseeded Nano held back until it was seeded. Asking for a USB cable would break
   * the setup the user just finished, so Bluetooth that cannot update says it is not possible.
   */
  updateAfterSetup?: boolean;
}>;

type ChecksDrawerInput = ChecksErrorDrawersInput &
  Readonly<{
    update: OfferedUpdate | null;
    onAcceptUpdate: () => void;
    onUpdatePressed?: () => void;
    onUpdateSheetClosed?: () => void;
    updateAfterSetup?: boolean;
  }>;

const recoverableErrorPage = "Error: unknown error";

const providerErrorPage = "Error: Device OS version not recognized";
const providerSettingsPage = "Error: Ledger Stax OS version not recognized";

function trackRecoverableButton(
  button: string,
  page: string,
  kind: RecoverableErrorKind,
  funnelProps: FunnelProps | null | undefined,
) {
  if (!funnelProps) {
    track("button_clicked", { button, page });
    return;
  }
  trackFunnelDrawerClick(button, funnelErrorPage(kind), funnelProps);
}

/** A drawer does not become the current page, so its clicks name it as `page`. */
function trackFunnelDrawerClick(button: string, page: OnboardingPage, funnelProps: FunnelProps) {
  track("button_clicked", { ...withSource(funnelProps), button, page });
}

function funnelErrorPage(kind: RecoverableErrorKind) {
  return kind === "declined"
    ? onboardingPages.genuineCheckRefused
    : onboardingPages.genuineCheckError;
}

function errorDrawerTracking(
  kind: RecoverableErrorKind,
  funnelProps: FunnelProps | null | undefined,
): DrawerTracking {
  if (!funnelProps) {
    return { trackName: kind === "provider" ? providerErrorPage : recoverableErrorPage };
  }
  return { trackCategory: funnelErrorPage(kind), trackProps: funnelProps };
}

function notGenuineDrawerTracking(funnelProps: FunnelProps | null | undefined): DrawerTracking {
  if (!funnelProps) return { trackCategory: "Device not genuine" };
  return {
    trackCategory: onboardingPages.genuineCheckError,
    trackProps: funnelProps,
  };
}

function toUpdateStep(
  offered: boolean,
  offerOpen: boolean,
  unsupportedOpen: boolean,
  usbRequired: boolean,
  suspendSheets: boolean,
): UpdateStep | null {
  if (suspendSheets) return null;
  if (unsupportedOpen) return usbRequired ? "unsupportedUsbDrawer" : "unsupportedNotEligibleDrawer";
  if (!offered) return null;
  return offerOpen ? "offerSheet" : "decisionScreen";
}

function openUrl(url: string) {
  const pending = Linking.openURL(url);
  if (pending) pending.catch(() => undefined);
}

function contactSupportWebviewUrl(locale: string): string {
  if (locale in urls.contactSupportWebview) {
    return urls.contactSupportWebview[locale as keyof typeof urls.contactSupportWebview];
  }
  return urls.contactSupportWebview.en;
}

function recoverableKindOf(error: ChecksDrawerInput["error"]): RecoverableErrorKind | null {
  if (!error || error.kind === "notGenuine") return null;
  return error.kind;
}

function deviceModelInfo(device: Device, version: string): DeviceModelInfo {
  return {
    modelId: device.modelId,
    deviceInfo: { version },
    apps: [],
  } as unknown as DeviceModelInfo;
}

function firmwareEligibility(device: Device, current: string, updateAfterSetup: boolean) {
  const info = deviceModelInfo(device, current);
  const newUxSupported = isNewFirmwareUpdateUxSupported(device, info);
  const bleSupported = isBleUpdateSupported(device, info);

  return {
    canUpdate: newUxSupported && (device.wired || bleSupported),
    isUsbRequired:
      Platform.OS === "android" && newUxSupported && !bleSupported && !updateAfterSetup,
  };
}

function dismissIfOpen(suspendSheets: boolean, open: boolean, close: () => void) {
  if (suspendSheets || !open) return;
  close();
}

function sheetOpen(active: boolean, suspendSheets: boolean) {
  return active && !suspendSheets;
}

function productNameOf(device: Device) {
  return getDeviceModel(device.modelId).productName || device.modelId;
}

function updateKeyOf(update: OfferedUpdate | null) {
  return update ? `${update.current}|${update.available}` : "";
}

/**
 * Starts the OS update when the device can take it, and otherwise opens the unsupported-update
 * sheet for the offered version.
 */
export function useFirmwareUpdateRequest({
  device,
  update,
  onAcceptUpdate,
  onUpdatePressed,
  onUnsupportedClosePressed,
  suspendSheets = false,
  updateAfterSetup = false,
}: FirmwareUpdateRequestInput): Readonly<{
  requestUpdate: () => void;
  unsupportedUpdate: UnsupportedUpdateDrawerProps;
}> {
  const [unsupportedFor, setUnsupportedFor] = useState<string | null>(null);
  const updateKey = updateKeyOf(update);
  const eligibility = update ? firmwareEligibility(device, update.current, updateAfterSetup) : null;
  const isUnsupportedUpdateOpen = unsupportedFor === updateKey && updateKey !== "";

  return {
    requestUpdate: () => {
      if (!eligibility) return;
      onUpdatePressed?.();
      if (eligibility.canUpdate) onAcceptUpdate();
      else setUnsupportedFor(updateKey);
    },
    unsupportedUpdate: {
      isOpen: sheetOpen(isUnsupportedUpdateOpen, suspendSheets),
      mounted: isUnsupportedUpdateOpen,
      isUsbRequired: eligibility?.isUsbRequired ?? false,
      productName: productNameOf(device),
      onClose: () => {
        if (!suspendSheets) setUnsupportedFor(null);
      },
      onClosePressed: onUnsupportedClosePressed,
    },
  };
}

/** The allow, recoverable error and not-genuine sheets of the checks. */
export function useChecksErrorDrawers({
  device,
  state,
  error,
  onRetry,
  onCloseSheet,
  onErrorCancel,
  onSkipFirmwareCheck,
  onAllowDismiss,
  onNotGenuineClose,
  funnelProps,
  suspendSheets = false,
}: ChecksErrorDrawersInput): Pick<
  ChecksDrawerProps,
  "allowSheet" | "errorDrawer" | "notGenuineDrawer"
> {
  const { locale } = useLocale();
  const productName = productNameOf(device);
  const { openSupport, openExperimentalSettings } = useInitializerActions({
    id: device.deviceId,
    name: device.deviceName ?? "",
    modelId: device.modelId,
    productName,
    wired: device.wired,
  });
  const recoverableKind = recoverableKindOf(error);
  const [retainedRecoverableKind, setRetainedRecoverableKind] = useState(recoverableKind);
  if (recoverableKind && recoverableKind !== retainedRecoverableKind) {
    setRetainedRecoverableKind(recoverableKind);
  }
  const errorDrawerKind = recoverableKind ?? retainedRecoverableKind ?? "unknown";
  const retry = useCallback(() => {
    const retryAfterRefusal = funnelProps && errorDrawerKind === "declined";
    const button = retryAfterRefusal ? onboardingButtons.retryGenuineCheck : "Try again";
    trackRecoverableButton(button, recoverableErrorPage, errorDrawerKind, funnelProps);
    onRetry();
  }, [errorDrawerKind, onRetry, funnelProps]);
  const cancel = useCallback(() => {
    trackRecoverableButton(
      "Cancel",
      errorDrawerKind === "provider" ? providerErrorPage : recoverableErrorPage,
      errorDrawerKind,
      funnelProps,
    );
    onErrorCancel();
  }, [errorDrawerKind, onErrorCancel, funnelProps]);
  const skip = useMemo(
    () =>
      onSkipFirmwareCheck
        ? () => {
            trackRecoverableButton(
              "Skip Ledger OS update",
              recoverableErrorPage,
              errorDrawerKind,
              funnelProps,
            );
            onSkipFirmwareCheck();
          }
        : undefined,
    [errorDrawerKind, onSkipFirmwareCheck, funnelProps],
  );
  const onContactSupport = useCallback(() => {
    trackRecoverableButton(
      "Contact Ledger Support",
      recoverableErrorPage,
      errorDrawerKind,
      funnelProps,
    );
    openSupport();
  }, [errorDrawerKind, openSupport, funnelProps]);
  const onContactNotGenuineSupport = useCallback(() => {
    const button = "Contacting support about non genuine device";
    if (funnelProps) {
      trackFunnelDrawerClick(button, onboardingPages.genuineCheckError, funnelProps);
    } else {
      track("button_clicked", { button });
    }
    openUrl(contactSupportWebviewUrl(locale));
  }, [locale, funnelProps]);
  const onNotGenuineClosePressed = useCallback(() => {
    if (!funnelProps) return;
    trackFunnelDrawerClick(onboardingButtons.close, onboardingPages.genuineCheckError, funnelProps);
  }, [funnelProps]);
  const onGoToSettings = useCallback(() => {
    trackRecoverableButton("Go to settings", providerSettingsPage, errorDrawerKind, funnelProps);
    openExperimentalSettings();
  }, [errorDrawerKind, openExperimentalSettings, funnelProps]);
  const [allowClosed, setAllowClosed] = useState(false);
  if ((state !== "awaitingAllow" || suspendSheets) && allowClosed) setAllowClosed(false);
  const allowOpen = state === "awaitingAllow" && !allowClosed && !suspendSheets;

  return {
    allowSheet: {
      deviceModelId: device.modelId,
      deviceName: device.deviceName ?? "",
      isOpen: allowOpen,
      onClose: allowOpen
        ? () => {
            setAllowClosed(true);
            onAllowDismiss();
          }
        : undefined,
    },
    errorDrawer: {
      isOpen: sheetOpen(recoverableKind !== null, suspendSheets),
      kind: errorDrawerKind,
      tracking: errorDrawerTracking(errorDrawerKind, funnelProps),
      productName,
      onRetry: retry,
      onCancel: cancel,
      onSkip: skip,
      onClose: () => dismissIfOpen(suspendSheets, recoverableKind !== null, onCloseSheet),
      onContactSupport,
      onGoToSettings,
    },
    notGenuineDrawer: {
      isOpen: sheetOpen(error?.kind === "notGenuine", suspendSheets),
      tracking: notGenuineDrawerTracking(funnelProps),
      productName,
      onClose: () => dismissIfOpen(suspendSheets, error?.kind === "notGenuine", onNotGenuineClose),
      onClosePressed: onNotGenuineClosePressed,
      onContactSupport: onContactNotGenuineSupport,
    },
  };
}

/** Every sheet of the seeded checks screen, with the legacy OS update drawer. */
export function useChecksDrawers({
  update,
  onAcceptUpdate,
  onUpdatePressed,
  onUpdateSheetClosed,
  updateAfterSetup = false,
  ...input
}: ChecksDrawerInput): ChecksDrawerProps & {
  headerQuitHidden: boolean;
  reopenFirmwareOffer: () => void;
  updateStep: UpdateStep | null;
} {
  const suspendSheets = input.suspendSheets ?? false;
  const errorDrawers = useChecksErrorDrawers(input);
  const { requestUpdate, unsupportedUpdate } = useFirmwareUpdateRequest({
    device: input.device,
    update,
    onAcceptUpdate,
    onUpdatePressed,
    onUnsupportedClosePressed: onUpdateSheetClosed,
    suspendSheets,
    updateAfterSetup,
  });
  const [dismissedOfferKey, setDismissedOfferKey] = useState<string | null>(null);
  const updateKey = updateKeyOf(update);
  const offered = input.state === "updating" && update !== null;
  const offerDismissed = dismissedOfferKey === updateKey;
  const offerOpen = offered && !offerDismissed && !unsupportedUpdate.mounted && !suspendSheets;

  return {
    ...errorDrawers,
    headerQuitHidden: offered && !offerDismissed,
    reopenFirmwareOffer: () => setDismissedOfferKey(null),
    updateStep: toUpdateStep(
      offered,
      offerOpen,
      unsupportedUpdate.mounted,
      unsupportedUpdate.isUsbRequired,
      suspendSheets,
    ),
    firmwareUpdate: {
      isOpen: offerOpen,
      firmwareVersion: update?.available ?? "",
      productName: productNameOf(input.device),
      onUpdate: requestUpdate,
      onClose: () => {
        // onClose also fires after a close by code, when the offer is no longer open.
        if (!offerOpen) return;
        onUpdateSheetClosed?.();
        setDismissedOfferKey(updateKey);
      },
    },
    unsupportedUpdate,
  };
}
