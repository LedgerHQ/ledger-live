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

type ChecksDrawerInput = Readonly<{
  device: Device;
  state: ChecksScreenState | null;
  error: { kind: GenuineErrorKind } | null;
  update: { current: string; available: string } | null;
  onRetry: () => void;
  onCloseSheet: () => void;
  onErrorCancel: () => void;
  onAcceptUpdate: () => void;
  onAllowDismiss: () => void;
  onNotGenuineClose: () => void;
  suspendSheets?: boolean;
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

export function useChecksDrawers({
  device,
  state,
  error,
  update,
  onRetry,
  onCloseSheet,
  onErrorCancel,
  onAcceptUpdate,
  onAllowDismiss,
  onNotGenuineClose,
  suspendSheets = false,
}: ChecksDrawerInput): ChecksDrawerProps & {
  headerQuitHidden: boolean;
  reopenFirmwareOffer: () => void;
} {
  const { locale } = useLocale();
  const productName = getDeviceModel(device.modelId).productName || device.modelId;
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
  const [dismissedOfferKey, setDismissedOfferKey] = useState<string | null>(null);
  const [unsupportedFor, setUnsupportedFor] = useState<string | null>(null);

  const updateKey = update ? `${update.current}|${update.available}` : "";
  const eligibility = update ? firmwareEligibility(device, update.current) : null;
  const offered = state === "updating" && update !== null;
  const offerDismissed = dismissedOfferKey === updateKey;
  const isUnsupportedUpdateOpen = unsupportedFor === updateKey && updateKey !== "";
  const offerOpen = offered && !offerDismissed && !isUnsupportedUpdateOpen && !suspendSheets;
  const allowOpen = state === "awaitingAllow" && !allowClosed && !suspendSheets;

  const acceptUpdate = () => {
    if (!eligibility) return;
    if (eligibility.canUpdate) onAcceptUpdate();
    else setUnsupportedFor(updateKey);
  };

  return {
    headerQuitHidden: offered && !offerDismissed,
    reopenFirmwareOffer: () => setDismissedOfferKey(null),
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
    firmwareUpdate: {
      isOpen: offerOpen,
      firmwareVersion: update?.available ?? "",
      productName,
      onUpdate: acceptUpdate,
      onClose: () => {
        if (offerOpen) setDismissedOfferKey(updateKey);
      },
    },
    unsupportedUpdate: {
      isOpen: sheetOpen(isUnsupportedUpdateOpen, suspendSheets),
      mounted: isUnsupportedUpdateOpen,
      isUsbRequired: eligibility?.isUsbRequired ?? false,
      productName,
      onClose: () => {
        if (!suspendSheets) setUnsupportedFor(null);
      },
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
