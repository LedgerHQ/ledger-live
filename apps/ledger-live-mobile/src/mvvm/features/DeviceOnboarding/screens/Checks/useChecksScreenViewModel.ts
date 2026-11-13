import { useCallback, useState } from "react";
import { Linking, Platform } from "react-native";
import { track } from "@shared/analytics";
import { getDeviceModel } from "@ledgerhq/devices";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { DeviceModelInfo } from "@ledgerhq/types-live";
import { useLocale, useTranslation } from "~/context/Locale";
import { urls } from "~/utils/urls";
import { useInitializerActions } from "LLM/components/DeviceIntentExecutor/ContextInitializer/hooks/useInitializerActions";
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
  deviceName: string;
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
  onContactSupport: () => void;
  onGoToSettings: () => void;
}>;

type NotGenuineDrawerProps = Readonly<{
  isOpen: boolean;
  productName: string;
  onClose: () => void;
  onContactSupport: () => void;
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
  onQuit: ChecksScreenProps["onQuit"],
) {
  if (suspendSheets || !isNotGenuine) return;
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

function sheetOpen(active: boolean, suspendSheets: boolean) {
  return active && !suspendSheets;
}

function allowSheetFor(
  device: Device,
  state: ChecksScreenState,
  allowClosed: boolean,
  suspendSheets: boolean,
  close: () => void,
): AllowSheetProps | undefined {
  if (state !== "awaitingAllow" || allowClosed) return undefined;
  return {
    deviceModelId: device.modelId,
    deviceName: device.deviceName ?? "",
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
  onContinue,
  onQuit,
  onAcceptUpdate,
  onDeclineUpdate,
  suspendSheets = false,
  updateAfterSetup = false,
}: ChecksScreenProps): ChecksViewProps {
  const { t } = useTranslation();
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
    onQuit?.();
  }, [errorDrawerKind, onQuit]);
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
  const layout = checksLayout(state, update !== null);
  const [allowClosed, setAllowClosed] = useState(false);
  if ((state !== "awaitingAllow" || suspendSheets) && allowClosed) setAllowClosed(false);
  const [dismissedOfferKey, setDismissedOfferKey] = useState<string | null>(null);
  const [unsupportedFor, setUnsupportedFor] = useState<string | null>(null);

  const updateKey = update ? `${update.current}|${update.available}` : "";
  const eligibility = update ? firmwareEligibility(device, update.current, updateAfterSetup) : null;
  const offered = state === "updating" && update !== null;
  const offerDismissed = dismissedOfferKey === updateKey;
  const isUnsupportedUpdateOpen = unsupportedFor === updateKey && updateKey !== "";
  const offerOpen = offered && !offerDismissed && !isUnsupportedUpdateOpen && !suspendSheets;

  const acceptUpdate = () => {
    if (!eligibility) return;
    if (eligibility.canUpdate) onAcceptUpdate();
    else setUnsupportedFor(updateKey);
  };
  const reopenFirmwareOffer = () => setDismissedOfferKey(null);

  return {
    ...checksLayouts(
      t,
      firmwareUpToDate,
      onContinue,
      onStart,
      reopenFirmwareOffer,
      onDeclineUpdate,
    )[layout],
    closeLabel: t("deviceOnboarding.checks.close"),
    onQuit: offered && !offerDismissed ? undefined : onQuit,
    allowSheet: allowSheetFor(device, state, allowClosed, suspendSheets, () => {
      setAllowClosed(true);
      onQuit?.();
    }),
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
      onClose: () => dismissRecoverableError(suspendSheets, recoverableKind, onCloseSheet),
      onContactSupport,
      onGoToSettings,
    },
    notGenuineDrawer: {
      isOpen: sheetOpen(error?.kind === "notGenuine", suspendSheets),
      productName,
      onClose: () => dismissNotGenuine(suspendSheets, error?.kind === "notGenuine", onQuit),
      onContactSupport: onContactNotGenuineSupport,
    },
  };
}
