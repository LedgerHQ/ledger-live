import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { getDeviceModel } from "@ledgerhq/devices";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { DeviceModelInfo } from "@ledgerhq/types-live";
import { useTranslation } from "~/context/Locale";
import type {
  ChecksScreenProps,
  ChecksScreenState,
  GenuineErrorKind,
} from "LLM/features/DeviceOnboarding/types";
import { checksTestIds } from "LLM/features/DeviceOnboarding/testIds";
import {
  isBleUpdateSupported,
  isNewFirmwareUpdateUxSupported,
} from "LLM/features/FirmwareUpdate/utils/isFirmwareUpdateSupported";

type AllowSheetProps = Readonly<{
  deviceModelId: Device["modelId"];
  deviceName?: string;
  title: string;
  onClose?: () => void;
}>;

type FirmwareUpdateDrawerProps = Readonly<{
  isOpen: boolean;
  onUpdate: () => void;
  onClose: () => void;
  productName: string;
  firmwareVersion: string;
}>;

type UnsupportedUpdateDrawerProps = Readonly<{
  isOpen: boolean;
  onClose: () => void;
  isUsbRequired: boolean;
  productName: string;
}>;

type RecoverableErrorKind = Exclude<GenuineErrorKind, "notGenuine">;

type ErrorDrawerProps = Readonly<{
  isOpen: boolean;
  kind: RecoverableErrorKind;
  productName: string;
  onRetry: () => void;
  onCancel: () => void;
  onClose: () => void;
}>;

type NotGenuineDrawerProps = Readonly<{
  isOpen: boolean;
  productName: string;
  onClose: () => void;
}>;

export type ChecksIllustration = "loading" | "scan" | "success";

export type ChecksViewProps = Readonly<{
  illustration?: ChecksIllustration;
  title: string;
  description?: string;
  primaryLabel?: string;
  primaryTestID?: string;
  primaryLoading?: boolean;
  onPrimary?: () => void;
  onQuit?: () => void;
  closeLabel: string;
  allowSheet?: AllowSheetProps;
  firmwareUpdate: FirmwareUpdateDrawerProps;
  unsupportedUpdate: UnsupportedUpdateDrawerProps;
  errorDrawer: ErrorDrawerProps;
  notGenuineDrawer: NotGenuineDrawerProps;
}>;

type ChecksLayout = Exclude<ChecksScreenState, "awaitingAllow" | "updating">;

type LayoutProps = Omit<
  ChecksViewProps,
  | "onQuit"
  | "closeLabel"
  | "allowSheet"
  | "firmwareUpdate"
  | "unsupportedUpdate"
  | "errorDrawer"
  | "notGenuineDrawer"
>;

function recoverableKindOf(error: ChecksScreenProps["error"]): RecoverableErrorKind | null {
  if (!error || error.kind === "notGenuine") return null;
  return error.kind;
}

function checksLayout(state: ChecksScreenState): ChecksLayout {
  if (state === "awaitingAllow" || state === "updating") return "checking";
  return state;
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

export function useChecksScreenViewModel({
  device,
  state,
  error,
  update,
  firmwareUpToDate,
  onStart,
  onRetry,
  onCloseSheet,
  onContinue,
  onQuit,
  onAcceptUpdate,
  onDeclineUpdate,
  onUnsupportedUpdate,
  onUnsupportedUpdateClosed,
}: ChecksScreenProps): ChecksViewProps {
  const { t } = useTranslation();
  const layout = checksLayout(state);
  const recoverableKind = recoverableKindOf(error);
  const [retainedRecoverableKind, setRetainedRecoverableKind] = useState(recoverableKind);
  if (recoverableKind && recoverableKind !== retainedRecoverableKind) {
    setRetainedRecoverableKind(recoverableKind);
  }
  const errorDrawerKind = recoverableKind ?? retainedRecoverableKind ?? "unknown";
  const [allowClosed, setAllowClosed] = useState(false);
  if (state !== "awaitingAllow" && allowClosed) setAllowClosed(false);
  const updateKey = update ? `${update.current}|${update.available}` : "";
  const [unsupportedFor, setUnsupportedFor] = useState<string | null>(null);
  const declinedFor = useRef<string | null>(null);
  const suppressOfferCloseFor = useRef<string | null>(null);
  const productName = getDeviceModel(device.modelId).productName || device.modelId;
  const eligibility = update ? firmwareEligibility(device, update.current) : null;
  const isUnsupportedUpdateOpen = unsupportedFor === updateKey && updateKey !== "";

  useEffect(() => {
    if (suppressOfferCloseFor.current === updateKey) return;
    suppressOfferCloseFor.current = null;
  }, [updateKey]);

  const layouts: Record<ChecksLayout, LayoutProps> = {
    synchronizing: {
      illustration: "loading",
      title: t("deviceOnboarding.checks.synchronizing.title"),
    },
    idle: {
      illustration: "scan",
      title: t("deviceOnboarding.checks.idle.title"),
      description: t("deviceOnboarding.checks.idle.description"),
      primaryLabel: t("deviceOnboarding.checks.idle.cta"),
      primaryTestID: checksTestIds.start,
      onPrimary: onStart,
    },
    checking: {
      illustration: "scan",
      title: t("deviceOnboarding.checks.checking.title"),
      description: t("deviceOnboarding.checks.checking.description"),
      primaryLabel: t("deviceOnboarding.checks.checking.cta"),
      primaryLoading: true,
    },
    succeeded: {
      illustration: "success",
      title: t(
        firmwareUpToDate
          ? "deviceOnboarding.checks.succeeded.title"
          : "deviceOnboarding.checks.succeeded.genuineTitle",
      ),
      primaryLabel: t("deviceOnboarding.checks.succeeded.cta"),
      primaryTestID: checksTestIds.continue,
      ...(onContinue ? { onPrimary: onContinue } : { primaryLoading: true }),
    },
  };

  return {
    ...layouts[layout],
    closeLabel: t("deviceOnboarding.checks.close"),
    onQuit: state === "updating" ? undefined : onQuit,
    allowSheet:
      state === "awaitingAllow" && !allowClosed
        ? {
            deviceModelId: device.modelId,
            deviceName: device.deviceName ?? undefined,
            title: t("earlySecurityCheck.allowManagerDrawer.title"),
            onClose: () => {
              setAllowClosed(true);
              onQuit?.();
            },
          }
        : undefined,
    firmwareUpdate: {
      isOpen: update !== null && !isUnsupportedUpdateOpen,
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
        onUnsupportedUpdate?.(eligibility.isUsbRequired);
      },
      onClose: () => {
        if (suppressOfferCloseFor.current === updateKey) return;
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
        onUnsupportedUpdateClosed?.();
      },
    },
    errorDrawer: {
      isOpen: recoverableKind !== null,
      kind: errorDrawerKind,
      productName,
      onRetry,
      onCancel: onCloseSheet,
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
        onQuit?.();
      },
    },
  };
}
