import { useTranslation } from "~/context/Locale";
import {
  useChecksDrawers,
  type ChecksDrawerProps,
} from "LLM/features/DeviceOnboarding/components/ChecksDrawers/useChecksDrawers";
import type {
  ChecksScreenProps,
  ChecksScreenState,
  TrackedScreen,
} from "LLM/features/DeviceOnboarding/types";
import { checksTestIds } from "LLM/features/DeviceOnboarding/testIds";

export type ChecksIllustration = "loading" | "scan" | "success";

type SecondaryAction = Readonly<{
  label: string;
  testID: string;
  onPress: () => void;
}>;

export type ChecksViewProps = ChecksDrawerProps &
  Readonly<{
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
    screenTracking: readonly TrackedScreen[];
  }>;

type ChecksLayout = Exclude<ChecksScreenState, "awaitingAllow">;

type LayoutProps = Omit<
  ChecksViewProps,
  keyof ChecksDrawerProps | "onQuit" | "closeLabel" | "screenTracking"
>;

function checksLayout(state: ChecksScreenState, hasUpdate: boolean): ChecksLayout {
  if (state === "awaitingAllow") return "checking";
  if (state === "updating" && !hasUpdate) return "checking";
  return state;
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
  onClosePressed,
  onAcceptUpdate,
  onDeclineUpdate,
  onUpdatePressed,
  onInstallUpdate,
  onUpdateSheetClosed,
  screensFor,
  seededDeviceType,
  suspendSheets = false,
}: ChecksScreenProps): ChecksViewProps {
  const { t } = useTranslation();
  const quit = () => onQuit?.();
  const closeAndQuit = () => {
    onClosePressed?.();
    quit();
  };
  const { headerQuitHidden, reopenFirmwareOffer, updateStep, ...drawers } = useChecksDrawers({
    device,
    state,
    error,
    update,
    onRetry,
    onCloseSheet,
    onErrorCancel: quit,
    onAcceptUpdate,
    onAllowDismiss: closeAndQuit,
    onNotGenuineClose: quit,
    onUpdatePressed,
    onUpdateSheetClosed,
    seededDeviceType,
    suspendSheets,
  });
  const installUpdate = () => {
    onInstallUpdate?.();
    reopenFirmwareOffer();
  };
  const layout = checksLayout(state, update !== null);

  return {
    ...checksLayouts(t, firmwareUpToDate, onContinue, onStart, installUpdate, onDeclineUpdate)[
      layout
    ],
    closeLabel: t("deviceOnboarding.checks.close"),
    screenTracking: screensFor?.(updateStep) ?? [],
    onQuit: !onQuit || (headerQuitHidden && !suspendSheets) ? undefined : closeAndQuit,
    ...drawers,
  };
}
