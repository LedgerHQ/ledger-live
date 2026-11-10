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
  isOpen: boolean;
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
  mounted: boolean;
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

type SecondaryAction = Readonly<{
  label: string;
  testID: string;
  onPress: () => void;
}>;

export type ChecksViewProps = Readonly<{
  illustration?: ChecksIllustration;
  title: string;
  description?: string;
  primaryLabel?: string;
  primaryTestID?: string;
  primaryLoading?: boolean;
  onPrimary?: () => void;
  secondary?: SecondaryAction;
  onQuit?: () => void;
  closeLabel: string;
  allowSheet?: AllowSheetProps;
  firmwareUpdate: FirmwareUpdateDrawerProps;
  unsupportedUpdate: UnsupportedUpdateDrawerProps;
  errorDrawer: ErrorDrawerProps;
  notGenuineDrawer: NotGenuineDrawerProps;
}>;

type ChecksLayout = Exclude<ChecksScreenState, "awaitingAllow">;

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

function checksLayout(state: ChecksScreenState, hasUpdate: boolean): ChecksLayout {
  if (state === "awaitingAllow") return "checking";
  if (state === "updating" && !hasUpdate) return "checking";
  return state;
}

function deviceModelInfo(device: Device, version: string): DeviceModelInfo {
  return {
    modelId: device.modelId,
    deviceInfo: { version },
    apps: [],
  } as unknown as DeviceModelInfo;
}

function headerQuit(
  state: ChecksScreenState,
  firmwareOfferClosed: boolean,
  onQuit: ChecksScreenProps["onQuit"],
) {
  if (state === "updating" && !firmwareOfferClosed) return undefined;
  return onQuit;
}

function firmwareOfferVisible(
  hasUpdate: boolean,
  unsupportedOpen: boolean,
  firmwareOfferClosed: boolean,
  suspendSheets: boolean,
) {
  return hasUpdate && !unsupportedOpen && !firmwareOfferClosed && !suspendSheets;
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

type KeyRef = { current: string | null };

function acceptOfferedUpdate(
  update: ChecksScreenProps["update"],
  eligibility: ReturnType<typeof firmwareEligibility> | null,
  updateKey: string,
  suppressOfferCloseFor: KeyRef,
  onAcceptUpdate: () => void,
  showUnsupported: (updateKey: string) => void,
) {
  if (!update || !eligibility) return;
  suppressOfferCloseFor.current = updateKey;
  if (eligibility.canUpdate) {
    onAcceptUpdate();
    return;
  }
  showUnsupported(updateKey);
}

type FirmwareOfferClose = Readonly<{
  suspendSheets: boolean;
  firmwareOfferOpen: boolean;
  updateKey: string;
  suppressOfferCloseFor: KeyRef;
  closedFirmwareOfferKeyRef: KeyRef;
  onCloseFirmwareOffer: ChecksScreenProps["onCloseFirmwareOffer"];
  rememberClosedOffer: (updateKey: string) => void;
}>;

function dismissFirmwareOffer({
  suspendSheets,
  firmwareOfferOpen,
  updateKey,
  suppressOfferCloseFor,
  closedFirmwareOfferKeyRef,
  onCloseFirmwareOffer,
  rememberClosedOffer,
}: FirmwareOfferClose) {
  if (suspendSheets || !firmwareOfferOpen || suppressOfferCloseFor.current === updateKey) return;
  if (closedFirmwareOfferKeyRef.current === updateKey) return;
  closedFirmwareOfferKeyRef.current = updateKey;
  rememberClosedOffer(updateKey);
  onCloseFirmwareOffer?.();
}

function dismissRecoverableError(
  suspendSheets: boolean,
  recoverableKind: RecoverableErrorKind | null,
  onCloseSheet: () => void,
) {
  if (suspendSheets || !recoverableKind) return;
  onCloseSheet();
}

function dismissNotGenuine(
  suspendSheets: boolean,
  isNotGenuine: boolean,
  onCloseNotGenuine: ChecksScreenProps["onCloseNotGenuine"],
  onQuit: ChecksScreenProps["onQuit"],
) {
  if (suspendSheets || !isNotGenuine) return;
  if (onCloseNotGenuine) {
    onCloseNotGenuine();
    return;
  }
  onQuit?.();
}

type Translate = ReturnType<typeof useTranslation>["t"];

function checksLayouts(
  translate: Translate,
  firmwareUpToDate: boolean,
  onContinue: ChecksScreenProps["onContinue"],
  onStart: () => void,
  onInstall: () => void,
  onSkip: () => void,
): Record<ChecksLayout, LayoutProps> {
  return {
    synchronizing: {
      illustration: "loading",
      title: translate("deviceOnboarding.checks.synchronizing.title"),
    },
    idle: {
      illustration: "scan",
      title: translate("deviceOnboarding.checks.idle.title"),
      description: translate("deviceOnboarding.checks.idle.description"),
      primaryLabel: translate("deviceOnboarding.checks.idle.cta"),
      primaryTestID: checksTestIds.start,
      onPrimary: onStart,
    },
    checking: {
      illustration: "scan",
      title: translate("deviceOnboarding.checks.checking.title"),
      description: translate("deviceOnboarding.checks.checking.description"),
      primaryLabel: translate("deviceOnboarding.checks.checking.cta"),
      primaryLoading: true,
    },
    updating: {
      illustration: "scan",
      title: translate("deviceOnboarding.checks.updating.title"),
      description: translate("deviceOnboarding.checks.updating.description"),
      primaryLabel: translate("deviceOnboarding.checks.updating.installCta"),
      primaryTestID: checksTestIds.installUpdate,
      onPrimary: onInstall,
      secondary: {
        label: translate("deviceOnboarding.checks.updating.skipCta"),
        testID: checksTestIds.skipUpdate,
        onPress: onSkip,
      },
    },
    succeeded: {
      illustration: "success",
      title: translate(
        firmwareUpToDate
          ? "deviceOnboarding.checks.succeeded.title"
          : "deviceOnboarding.checks.succeeded.genuineTitle",
      ),
      primaryLabel: translate("deviceOnboarding.checks.succeeded.cta"),
      primaryTestID: checksTestIds.continue,
      ...(onContinue ? { onPrimary: onContinue } : { primaryLoading: true }),
    },
  };
}

function checksFlags(
  state: ChecksScreenState,
  update: ChecksScreenProps["update"],
  device: Device,
  closedFirmwareOfferKey: string | null,
  unsupportedFor: string | null,
) {
  const updateKey = update ? `${update.current}|${update.available}` : "";
  return {
    updateKey,
    firmwareOfferOpen: state === "updating" && update !== null,
    firmwareOfferClosed: closedFirmwareOfferKey === updateKey && updateKey !== "",
    eligibility: update ? firmwareEligibility(device, update.current) : null,
    isUnsupportedUpdateOpen: unsupportedFor === updateKey && updateKey !== "",
  };
}

function sheetOpen(active: boolean, suspendSheets: boolean) {
  return active && !suspendSheets;
}

function closeUnsupportedUpdate(
  suspendSheets: boolean,
  suppressOfferCloseFor: KeyRef,
  clear: () => void,
) {
  if (suspendSheets) return;
  suppressOfferCloseFor.current = null;
  clear();
}

function allowSheetFor(
  device: Device,
  state: ChecksScreenState,
  allowClosed: boolean,
  suspendSheets: boolean,
  title: string,
  close: () => void,
): AllowSheetProps | undefined {
  if (state !== "awaitingAllow" || allowClosed) return undefined;
  return {
    deviceModelId: device.modelId,
    deviceName: device.deviceName ?? undefined,
    title,
    isOpen: !suspendSheets,
    onClose: suspendSheets ? undefined : close,
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
  onCloseNotGenuine,
  onCloseFirmwareOffer,
  onContinue,
  onQuit,
  onAcceptUpdate,
  onDeclineUpdate,
  suspendSheets = false,
}: ChecksScreenProps): ChecksViewProps {
  const { t } = useTranslation();
  const layout = checksLayout(state, update !== null);
  const recoverableKind = recoverableKindOf(error);
  const [retainedRecoverableKind, setRetainedRecoverableKind] = useState(recoverableKind);
  if (recoverableKind && recoverableKind !== retainedRecoverableKind) {
    setRetainedRecoverableKind(recoverableKind);
  }
  const errorDrawerKind = recoverableKind ?? retainedRecoverableKind ?? "unknown";
  const [allowClosed, setAllowClosed] = useState(false);
  const [closedFirmwareOfferKey, setClosedFirmwareOfferKey] = useState<string | null>(null);
  const closedFirmwareOfferKeyRef = useRef<string | null>(null);
  if (state !== "awaitingAllow" && allowClosed) setAllowClosed(false);
  const [unsupportedFor, setUnsupportedFor] = useState<string | null>(null);
  const suppressOfferCloseFor = useRef<string | null>(null);
  const {
    updateKey,
    firmwareOfferOpen,
    firmwareOfferClosed,
    eligibility,
    isUnsupportedUpdateOpen,
  } = checksFlags(state, update, device, closedFirmwareOfferKey, unsupportedFor);
  const productName = getDeviceModel(device.modelId).productName || device.modelId;

  const acceptUpdate = () =>
    acceptOfferedUpdate(
      update,
      eligibility,
      updateKey,
      suppressOfferCloseFor,
      onAcceptUpdate,
      setUnsupportedFor,
    );

  useEffect(() => {
    if (suppressOfferCloseFor.current === updateKey) return;
    suppressOfferCloseFor.current = null;
  }, [updateKey]);

  return {
    ...checksLayouts(t, firmwareUpToDate, onContinue, onStart, acceptUpdate, onDeclineUpdate)[
      layout
    ],
    closeLabel: t("deviceOnboarding.checks.close"),
    onQuit: headerQuit(state, firmwareOfferClosed, onQuit),
    allowSheet: allowSheetFor(
      device,
      state,
      allowClosed,
      suspendSheets,
      t("earlySecurityCheck.allowManagerDrawer.title"),
      () => {
        setAllowClosed(true);
        onQuit?.();
      },
    ),
    firmwareUpdate: {
      isOpen: firmwareOfferVisible(
        update !== null,
        isUnsupportedUpdateOpen,
        firmwareOfferClosed,
        suspendSheets,
      ),
      firmwareVersion: update?.available ?? "",
      productName,
      onUpdate: acceptUpdate,
      onClose: () =>
        dismissFirmwareOffer({
          suspendSheets,
          firmwareOfferOpen,
          updateKey,
          suppressOfferCloseFor,
          closedFirmwareOfferKeyRef,
          onCloseFirmwareOffer,
          rememberClosedOffer: setClosedFirmwareOfferKey,
        }),
    },
    unsupportedUpdate: {
      isOpen: sheetOpen(isUnsupportedUpdateOpen, suspendSheets),
      mounted: isUnsupportedUpdateOpen,
      isUsbRequired: eligibility?.isUsbRequired ?? false,
      productName,
      onClose: () =>
        closeUnsupportedUpdate(suspendSheets, suppressOfferCloseFor, () => setUnsupportedFor(null)),
    },
    errorDrawer: {
      isOpen: sheetOpen(recoverableKind !== null, suspendSheets),
      kind: errorDrawerKind,
      productName,
      onRetry,
      onCancel: () => onQuit?.(),
      onClose: () => dismissRecoverableError(suspendSheets, recoverableKind, onCloseSheet),
    },
    notGenuineDrawer: {
      isOpen: sheetOpen(error?.kind === "notGenuine", suspendSheets),
      productName,
      onClose: () =>
        dismissNotGenuine(suspendSheets, error?.kind === "notGenuine", onCloseNotGenuine, onQuit),
    },
  };
}
