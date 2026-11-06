import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { getDeviceModel } from "@ledgerhq/devices";
import { useTranslation } from "~/context/Locale";
import {
  isBleUpdateSupported,
  isNewFirmwareUpdateUxSupported,
} from "LLM/features/FirmwareUpdate/utils/isFirmwareUpdateSupported";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { DeviceModelInfo } from "@ledgerhq/types-live";
import type { ChecksScreenState, GenuineErrorKind } from "LLM/features/DeviceOnboarding/types";

export type AllowSheetProps = Readonly<{
  deviceModelId: Device["modelId"];
  deviceName?: string;
  title: string;
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
}>;

export type NotGenuineDrawerProps = Readonly<{
  isOpen: boolean;
  productName: string;
  onClose: () => void;
}>;

export type ChecksDrawerProps = Readonly<{
  allowSheet?: AllowSheetProps;
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
  onDeclineUpdate: () => void;
  onAllowDismiss: () => void;
  onNotGenuineClose: () => void;
  onCloseFirmwareOffer?: () => void;
  hideAllowSheet?: boolean;
  resumeAllowSheet?: boolean;
}>;

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

export function useChecksDrawers({
  device,
  state,
  error,
  update,
  onRetry,
  onCloseSheet,
  onErrorCancel,
  onAcceptUpdate,
  onDeclineUpdate,
  onAllowDismiss,
  onNotGenuineClose,
  onCloseFirmwareOffer,
  hideAllowSheet = false,
  resumeAllowSheet = false,
}: ChecksDrawerInput): ChecksDrawerProps & { headerQuitHidden: boolean } {
  const { t } = useTranslation();
  const recoverableKind = recoverableKindOf(error);
  const [retainedRecoverableKind, setRetainedRecoverableKind] = useState(recoverableKind);
  if (recoverableKind && recoverableKind !== retainedRecoverableKind) {
    setRetainedRecoverableKind(recoverableKind);
  }
  const errorDrawerKind = recoverableKind ?? retainedRecoverableKind ?? "unknown";
  const [allowClosed, setAllowClosed] = useState(false);
  const [closedFirmwareOfferKey, setClosedFirmwareOfferKey] = useState<string | null>(null);
  const closedFirmwareOfferKeyRef = useRef<string | null>(null);
  if (allowClosed && (state !== "awaitingAllow" || (resumeAllowSheet && !hideAllowSheet))) {
    setAllowClosed(false);
  }
  const updateKey = update ? `${update.current}|${update.available}` : "";
  const [unsupportedFor, setUnsupportedFor] = useState<string | null>(null);
  const declinedFor = useRef<string | null>(null);
  const suppressOfferCloseFor = useRef<string | null>(null);
  const firmwareOfferOpen = state === "updating" && update !== null;
  const firmwareOfferClosed = closedFirmwareOfferKey === updateKey && updateKey !== "";
  const productName = getDeviceModel(device.modelId).productName || device.modelId;
  const eligibility = update ? firmwareEligibility(device, update.current) : null;
  const isUnsupportedUpdateOpen = unsupportedFor === updateKey && updateKey !== "";

  useEffect(() => {
    if (suppressOfferCloseFor.current === updateKey) return;
    suppressOfferCloseFor.current = null;
  }, [updateKey]);

  return {
    headerQuitHidden: state === "updating" && !firmwareOfferClosed,
    allowSheet:
      state === "awaitingAllow" && !allowClosed && !hideAllowSheet
        ? {
            deviceModelId: device.modelId,
            deviceName: device.deviceName ?? undefined,
            title: t("earlySecurityCheck.allowManagerDrawer.title"),
            onClose: () => {
              setAllowClosed(true);
              onAllowDismiss();
            },
          }
        : undefined,
    firmwareUpdate: {
      isOpen: update !== null && !isUnsupportedUpdateOpen && !firmwareOfferClosed,
      firmwareVersion: update?.available ?? "",
      productName,
      onUpdate: () => {
        if (!update || !eligibility) return;
        if (eligibility.canUpdate) {
          suppressOfferCloseFor.current = updateKey;
          onAcceptUpdate();
          return;
        }
        suppressOfferCloseFor.current = updateKey;
        setUnsupportedFor(updateKey);
      },
      onClose: () => {
        if (!firmwareOfferOpen) return;
        if (suppressOfferCloseFor.current === updateKey) return;
        if (onCloseFirmwareOffer) {
          if (closedFirmwareOfferKeyRef.current === updateKey) return;
          closedFirmwareOfferKeyRef.current = updateKey;
          setClosedFirmwareOfferKey(updateKey);
          onCloseFirmwareOffer();
          return;
        }
        if (declinedFor.current === updateKey) return;
        declinedFor.current = updateKey;
        onDeclineUpdate();
      },
    },
    unsupportedUpdate: {
      isOpen: isUnsupportedUpdateOpen,
      isUsbRequired: eligibility?.isUsbRequired ?? false,
      productName,
      onClose: () => {
        suppressOfferCloseFor.current = null;
        setUnsupportedFor(null);
      },
    },
    errorDrawer: {
      isOpen: recoverableKind !== null,
      kind: errorDrawerKind,
      productName,
      onRetry,
      onCancel: onErrorCancel,
      onClose: () => {
        if (!recoverableKind) return;
        onCloseSheet();
      },
    },
    notGenuineDrawer: {
      isOpen: error?.kind === "notGenuine",
      productName,
      onClose: () => {
        if (error?.kind !== "notGenuine") return;
        onNotGenuineClose();
      },
    },
  };
}
