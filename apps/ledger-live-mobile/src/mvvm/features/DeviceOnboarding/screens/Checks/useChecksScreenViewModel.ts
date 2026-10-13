import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useTranslation } from "~/context/Locale";
import type { ChecksScreenProps, ChecksScreenState } from "LLM/features/DeviceOnboarding/types";
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
}>;

type ChecksLayout = Exclude<ChecksScreenState, "awaitingAllow" | "updating" | "error">;

type LayoutProps = Omit<ChecksViewProps, "onQuit" | "closeLabel" | "allowSheet" | "updateSheet">;

function checksLayout(state: Exclude<ChecksScreenState, "error">): ChecksLayout {
  if (state === "awaitingAllow" || state === "updating") return "checking";
  return state;
}

export function useChecksScreenViewModel({
  device,
  state,
  onStart,
  onCloseSheet,
  onContinue,
  onQuit,
  onAcceptUpdate,
  onDeclineUpdate,
}: ChecksScreenProps): ChecksViewProps | null {
  const { t } = useTranslation();
  if (state === "error") return null;

  const layout = checksLayout(state);

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
  };
}
