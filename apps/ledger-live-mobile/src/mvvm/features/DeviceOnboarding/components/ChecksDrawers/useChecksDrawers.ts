import { useCallback, useState } from "react";
import { Linking, Platform } from "react-native";
import { track } from "@shared/analytics";
import { getDeviceModel } from "@ledgerhq/devices";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { DeviceModelInfo } from "@ledgerhq/types-live";
import { useLocale } from "~/context/Locale";
import { urls } from "~/utils/urls";
import { useInitializerActions } from "LLM/components/DeviceIntentExecutor/ContextInitializer/hooks/useInitializerActions";
import type { ChecksScreenState, GenuineErrorKind } from "LLM/features/DeviceOnboarding/types";
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
  isUsbRequired: boolean;
  productName: string;
}>;

type RecoverableErrorKind = Exclude<GenuineErrorKind, "notGenuine">;

export type ErrorDrawerProps = Readonly<{
  isOpen: boolean;
  kind: RecoverableErrorKind;
  productName: string;
  onRetry: () => void;
  onCancel: () => void;
  onClose: () => void;
  onContactSupport: () => void;
  onGoToSettings: () => void;
}>;

export type NotGenuineDrawerProps = Readonly<{
  isOpen: boolean;
  productName: string;
  onClose: () => void;
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
  onAllowDismiss: () => void;
  onNotGenuineClose: () => void;
  suspendSheets?: boolean;
}>;

type FirmwareUpdateRequestInput = Readonly<{
  device: Device;
  update: OfferedUpdate | null;
  onAcceptUpdate: () => void;
  suspendSheets?: boolean;
}>;

type ChecksDrawerInput = ChecksErrorDrawersInput &
  Readonly<{
    update: OfferedUpdate | null;
    onAcceptUpdate: () => void;
  }>;

const recoverableErrorPage = "Error: unknown error";

const providerErrorPage = "Error: Device OS version not recognized";
const providerSettingsPage = "Error: Ledger Stax OS version not recognized";

function trackRecoverableButton(button: string, page = recoverableErrorPage) {
  track("button_clicked", { button, page });
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

function firmwareEligibility(device: Device, current: string) {
  const info = deviceModelInfo(device, current);
  const newUxSupported = isNewFirmwareUpdateUxSupported(device, info);
  const bleSupported = isBleUpdateSupported(device, info);

  return {
    canUpdate: newUxSupported && (device.wired || bleSupported),
    isUsbRequired: Platform.OS === "android" && newUxSupported && !bleSupported,
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
  suspendSheets = false,
}: FirmwareUpdateRequestInput): Readonly<{
  requestUpdate: () => void;
  unsupportedUpdate: UnsupportedUpdateDrawerProps;
}> {
  const [unsupportedFor, setUnsupportedFor] = useState<string | null>(null);
  const updateKey = updateKeyOf(update);
  const eligibility = update ? firmwareEligibility(device, update.current) : null;
  const isUnsupportedUpdateOpen = unsupportedFor === updateKey && updateKey !== "";

  return {
    requestUpdate: () => {
      if (!eligibility) return;
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
  onAllowDismiss,
  onNotGenuineClose,
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
    trackRecoverableButton("Try again");
    onRetry();
  }, [onRetry]);
  const cancel = useCallback(() => {
    trackRecoverableButton(
      "Cancel",
      errorDrawerKind === "provider" ? providerErrorPage : recoverableErrorPage,
    );
    onErrorCancel();
  }, [errorDrawerKind, onErrorCancel]);
  const onContactSupport = useCallback(() => {
    trackRecoverableButton("Contact Ledger Support");
    openSupport();
  }, [openSupport]);
  const onContactNotGenuineSupport = useCallback(() => {
    track("button_clicked", { button: "Contacting support about non genuine device" });
    openUrl(contactSupportWebviewUrl(locale));
  }, [locale]);
  const onGoToSettings = useCallback(() => {
    trackRecoverableButton("Go to settings", providerSettingsPage);
    openExperimentalSettings();
  }, [openExperimentalSettings]);
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
      productName,
      onRetry: retry,
      onCancel: cancel,
      onClose: () => dismissIfOpen(suspendSheets, recoverableKind !== null, onCloseSheet),
      onContactSupport,
      onGoToSettings,
    },
    notGenuineDrawer: {
      isOpen: sheetOpen(error?.kind === "notGenuine", suspendSheets),
      productName,
      onClose: () => dismissIfOpen(suspendSheets, error?.kind === "notGenuine", onNotGenuineClose),
      onContactSupport: onContactNotGenuineSupport,
    },
  };
}

/** Every sheet of the seeded checks screen, with the legacy OS update drawer. */
export function useChecksDrawers({
  update,
  onAcceptUpdate,
  ...input
}: ChecksDrawerInput): ChecksDrawerProps & {
  headerQuitHidden: boolean;
  reopenFirmwareOffer: () => void;
} {
  const suspendSheets = input.suspendSheets ?? false;
  const errorDrawers = useChecksErrorDrawers(input);
  const { requestUpdate, unsupportedUpdate } = useFirmwareUpdateRequest({
    device: input.device,
    update,
    onAcceptUpdate,
    suspendSheets,
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
    firmwareUpdate: {
      isOpen: offerOpen,
      firmwareVersion: update?.available ?? "",
      productName: productNameOf(input.device),
      onUpdate: requestUpdate,
      onClose: () => {
        if (offerOpen) setDismissedOfferKey(updateKey);
      },
    },
    unsupportedUpdate,
  };
}
