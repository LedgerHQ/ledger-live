import { useState } from "react";
import { getDeviceModel } from "@ledgerhq/devices";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useTranslation } from "~/context/Locale";
import type {
  ChecksScreenProps,
  ChecksScreenState,
  GenuineErrorKind,
} from "LLM/features/DeviceOnboarding/types";
import { checksTestIds } from "LLM/features/DeviceOnboarding/testIds";

type AllowSheetProps = Readonly<{
  deviceModelId: Device["modelId"];
  deviceName?: string;
  title: string;
  onClose: () => void;
}>;

type UpdateSheetProps = Readonly<{
  onUpdate: () => void;
  onCancel: () => void;
  onClose: () => void;
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
  updateSheet?: UpdateSheetProps;
  errorDrawer: ErrorDrawerProps;
  notGenuineDrawer: NotGenuineDrawerProps;
}>;

type ChecksLayout = Exclude<ChecksScreenState, "awaitingAllow" | "updating">;

type LayoutProps = Omit<
  ChecksViewProps,
  "onQuit" | "closeLabel" | "allowSheet" | "updateSheet" | "errorDrawer" | "notGenuineDrawer"
>;

function recoverableKindOf(error: ChecksScreenProps["error"]): RecoverableErrorKind | null {
  if (!error || error.kind === "notGenuine") return null;
  return error.kind;
}

function checksLayout(state: ChecksScreenState): ChecksLayout {
  if (state === "awaitingAllow" || state === "updating") return "checking";
  return state;
}

export function useChecksScreenViewModel({
  device,
  state,
  error,
  onStart,
  onRetry,
  onCloseSheet,
  onContinue,
  onQuit,
  onAcceptUpdate,
  onDeclineUpdate,
}: ChecksScreenProps): ChecksViewProps {
  const { t } = useTranslation();
  const layout = checksLayout(state);
  const productName = getDeviceModel(device.modelId).productName || device.modelId;
  const recoverableKind = recoverableKindOf(error);
  const [retainedRecoverableKind, setRetainedRecoverableKind] = useState(recoverableKind);
  if (recoverableKind && recoverableKind !== retainedRecoverableKind) {
    setRetainedRecoverableKind(recoverableKind);
  }
  const errorDrawerKind = recoverableKind ?? retainedRecoverableKind ?? "unknown";

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
      title: t("deviceOnboarding.checks.succeeded.title"),
      primaryLabel: t("deviceOnboarding.checks.succeeded.cta"),
      primaryTestID: checksTestIds.continue,
      onPrimary: onContinue,
    },
  };

  return {
    ...layouts[layout],
    closeLabel: t("deviceOnboarding.checks.close"),
    onQuit: state === "updating" ? undefined : onQuit,
    allowSheet:
      state === "awaitingAllow"
        ? {
            deviceModelId: device.modelId,
            deviceName: device.deviceName ?? undefined,
            title: t("earlySecurityCheck.allowManagerDrawer.title"),
            onClose: onCloseSheet,
          }
        : undefined,
    updateSheet:
      state === "updating"
        ? {
            onUpdate: onAcceptUpdate,
            onCancel: onDeclineUpdate,
            onClose: onCloseSheet,
          }
        : undefined,
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
        onCloseSheet();
      },
    },
  };
}
