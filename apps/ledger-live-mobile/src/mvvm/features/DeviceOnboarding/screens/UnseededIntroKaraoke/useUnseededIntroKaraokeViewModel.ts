import { useRef, useState } from "react";
import type { DeviceModelId } from "@ledgerhq/devices";
import { useFeature } from "@features/platform-feature-flags";
import {
  karaokeScreen,
  karaokes,
  onboardingButtons,
  trackKaraokeAdvanced,
  trackKaraokeCompleted,
  trackOnboardingClick,
  type FunnelProps,
  type ScreenTracking,
} from "@features/platform-device-onboarding-analytics";
import { useTranslation } from "~/context/Locale";
import { isLegacyNano } from "LLM/features/Onboarding/utils/isLegacyNano";

export type UnseededIntroKaraokeScreenProps = Readonly<{
  deviceModelId: DeviceModelId;
  /** Set for a tracked funnel: the karaoke then sends its events. */
  funnelProps?: FunnelProps | null;
  /** True while another sheet (unlock, quit confirmation) must show on top. Hides the warning. */
  suspendSheets?: boolean;
  /** Returns true when the funnel took the step; false (for example while locked) allows a retry. */
  onFinish: () => boolean;
  onClose: () => void;
}>;

export type CounterfeitWarningModel = Readonly<{
  isOpen: boolean;
  isSuspended: boolean;
  deviceModelId: DeviceModelId;
  onProceed: () => void;
  onDismiss: () => void;
}>;

export type UnseededIntroKaraokeViewProps = Readonly<{
  phrases: readonly string[];
  tapLabel: string;
  actionLabel: string;
  closeLabel: string;
  screenTracking: ScreenTracking | null;
  onAdvance: (shownIndex: number) => void;
  onAction: () => void;
  onClose: () => void;
  /** Null when this device and flag need no warning. */
  counterfeitWarning: CounterfeitWarningModel | null;
}>;

export function useUnseededIntroKaraokeViewModel({
  deviceModelId,
  funnelProps = null,
  suspendSheets = false,
  onFinish,
  onClose,
}: UnseededIntroKaraokeScreenProps): UnseededIntroKaraokeViewProps {
  const { t } = useTranslation();
  const warningFeature = useFeature("lwmOnboardingCounterfeitWarning");
  const needsWarning = warningFeature?.enabled === true && isLegacyNano(deviceModelId);
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const hasFinished = useRef(false);

  // CONTINUE goes once, and never while another sheet (unlock, quit confirmation) is on top.
  // Marked done only when the funnel takes it, so a tap that races a lock can be retried.
  const finish = () => {
    if (suspendSheets || hasFinished.current) return;
    if (!onFinish()) return;
    hasFinished.current = true;
    if (funnelProps) trackKaraokeCompleted(karaokes.intro, funnelProps);
    setIsWarningOpen(false);
  };

  const phrases = [
    t("deviceOnboarding.karaoke.intro.takeControl"),
    t("deviceOnboarding.karaoke.intro.keysStayWithYou"),
    t("deviceOnboarding.karaoke.intro.nothingMoves"),
    t("deviceOnboarding.karaoke.intro.setUp"),
  ];

  return {
    phrases,
    tapLabel: t("deviceOnboarding.karaoke.tapToContinue"),
    actionLabel: t("deviceOnboarding.karaoke.intro.cta"),
    closeLabel: t("deviceOnboarding.checks.close"),
    screenTracking: funnelProps ? karaokeScreen(karaokes.intro, funnelProps, phrases.length) : null,
    onAdvance: shownIndex => {
      if (funnelProps) {
        trackKaraokeAdvanced(karaokes.intro, funnelProps, shownIndex, phrases.length);
      }
    },
    onAction: () => {
      if (funnelProps) {
        trackOnboardingClick(onboardingButtons.startSetup, funnelProps, {
          page: karaokes.intro.page,
          karaokeType: karaokes.intro.karaokeType,
        });
      }
      if (needsWarning) setIsWarningOpen(true);
      else finish();
    },
    onClose,
    counterfeitWarning: needsWarning
      ? {
          isOpen: isWarningOpen && !suspendSheets,
          isSuspended: suspendSheets,
          deviceModelId,
          onProceed: () => {
            if (isWarningOpen) finish();
          },
          // Hiding the drawer for another sheet also calls this: keep it open to resume after.
          onDismiss: () => {
            if (!suspendSheets) setIsWarningOpen(false);
          },
        }
      : null,
  };
}
