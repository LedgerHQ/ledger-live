import { useCallback, useMemo, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFeature } from "@features/platform-feature-flags";
import { setOverride } from "@shared/feature-flags";
import {
  isCooldownElapsed,
  shouldThrottle,
} from "@ledgerhq/live-common/postOnboarding/logic/upsellFrequency";
import {
  onboardingDateSelector,
  setPostOnboardingDate,
} from "@ledgerhq/live-common/postOnboarding/reducer";
import {
  lastSeenUpsellModalSelector,
  resetUpsellModalRetries,
  retriesUpsellModalSelector,
  setLastSeenUpsellModal,
  setUpsellModalRetries,
} from "@ledgerhq/live-engagement/largeScreenUpsellModal";
import type { FeatureIntroViewModel } from "LLM/components/FeatureIntroLayout/types";
import { useTranslation } from "~/context/Locale";
import { useDispatch, useSelector } from "~/context/hooks";
import { analyticsEnabledSelector } from "~/reducers/settings";
import {
  useLargeScreenUpsellEligibility,
  type LargeScreenUpsellIneligibilityReason,
} from "../hooks/useLargeScreenUpsellEligibility";
import {
  buildLargeScreenUpsellContent,
  type LargeScreenUpsellVariant,
} from "../utils/upsellContent";
import { parseDateOrOffset } from "./utils";

const FLAG_KEY = "largeScreenUpsell";
const PREVIEW_MODAL_ID = "large-screen-upsell-modal-debug-preview";
const PREVIEW_IOS_BOTTOM_PADDING = 20;

const parseNonNegativeInteger = (value: string): number | undefined => {
  const trimmed = value.trim();
  const parsed = Number(trimmed);
  return trimmed !== "" && Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : undefined;
};

const parseUnitInterval = (value: string): number | undefined => {
  const trimmed = value.trim();
  const parsed = Number(trimmed);
  return trimmed !== "" && Number.isFinite(parsed) && parsed >= 0 && parsed <= 1 ? parsed : undefined;
};

const INELIGIBILITY_HINTS: Record<LargeScreenUpsellIneligibilityReason, string> = {
  feature_disabled: "Feature flag is off.",
  no_nano: "No Nano device seen on this account.",
  model_disabled: "The seen Nano model is disabled in the flag audience.",
  touchscreen_seen: "A touchscreen device has already been seen.",
  cooldown: "Cooldown has not elapsed yet.",
};

const toIso = (date: Date | null) =>
  date && !Number.isNaN(date.getTime()) ? date.toISOString() : "";

export function useLargeScreenUpsellDebugViewModel() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { bottom } = useSafeAreaInsets();
  const feature = useFeature(FLAG_KEY);
  const eligibility = useLargeScreenUpsellEligibility();

  const onboardingDate = useSelector(onboardingDateSelector);
  const retries = useSelector(retriesUpsellModalSelector);
  const lastSeenAt = useSelector(lastSeenUpsellModalSelector);
  const analyticsEnabled = useSelector(analyticsEnabledSelector);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewVariant, setPreviewVariant] = useState<LargeScreenUpsellVariant>(
    analyticsEnabled ? "opted_in" : "opted_out",
  );

  const params = feature?.params;
  const killThreshold = params?.modal?.killThreshold;
  const cadenceDays = params?.modal?.cadenceDays;
  const modalEnabled = params?.modal?.enabled ?? false;
  const cooldownDaysDefault = params?.cooldownDays?.default;
  const isFlagEnabled = feature?.enabled ?? false;

  const now = new Date();
  const lastSeenDate = lastSeenAt != null ? new Date(lastSeenAt) : null;

  const resolvedCooldownDays =
    "cooldownDays" in eligibility ? eligibility.cooldownDays : cooldownDaysDefault;

  const cooldownElapsed = isCooldownElapsed(onboardingDate, resolvedCooldownDays ?? 0, now);

  const throttled =
    killThreshold != null && cadenceDays != null
      ? shouldThrottle(retries, lastSeenDate, killThreshold, cadenceDays, now)
      : false;

  const wouldShow = eligibility.isEligible && modalEnabled && !throttled;

  const audienceOk = isFlagEnabled
    ? eligibility.isEligible || eligibility.reason === "cooldown"
    : null;
  const cooldownOk = audienceOk === true ? cooldownElapsed : null;
  const notThrottledOk = isFlagEnabled ? !throttled : null;

  const audienceHint =
    audienceOk === false && !eligibility.isEligible
      ? INELIGIBILITY_HINTS[eligibility.reason]
      : undefined;

  const handleToggleFlag = useCallback(
    (enabled: boolean) => {
      if (!feature) return;
      dispatch(setOverride({ key: FLAG_KEY, value: { ...feature, enabled } }));
    },
    [dispatch, feature],
  );

  const overrideParams = useCallback(
    (nextParams: NonNullable<typeof params>) => {
      if (!feature) return;
      dispatch(setOverride({ key: FLAG_KEY, value: { ...feature, params: nextParams } }));
    },
    [dispatch, feature],
  );

  const handleToggleModalEnabled = useCallback(
    (enabled: boolean) => {
      if (!params) return;
      overrideParams({ ...params, modal: { ...params.modal, enabled } });
    },
    [overrideParams, params],
  );

  const handleApplyKillThreshold = useCallback(
    (value: string) => {
      if (!params) return "Feature params unavailable.";
      const parsed = parseNonNegativeInteger(value);
      if (parsed === undefined) return "Enter a non-negative integer.";
      overrideParams({ ...params, modal: { ...params.modal, killThreshold: parsed } });
      return undefined;
    },
    [overrideParams, params],
  );

  const handleApplyCadenceDays = useCallback(
    (value: string) => {
      if (!params) return "Feature params unavailable.";
      const parsed = parseNonNegativeInteger(value);
      if (parsed === undefined) return "Enter a non-negative integer.";
      overrideParams({ ...params, modal: { ...params.modal, cadenceDays: parsed } });
      return undefined;
    },
    [overrideParams, params],
  );

  const handleApplyCooldownDays = useCallback(
    (value: string) => {
      if (!params) return "Feature params unavailable.";
      const parsed = parseNonNegativeInteger(value);
      if (parsed === undefined) return "Enter a non-negative integer.";
      overrideParams({ ...params, cooldownDays: { ...params.cooldownDays, default: parsed } });
      return undefined;
    },
    [overrideParams, params],
  );

  const handleApplyDiscount = useCallback(
    (value: string) => {
      if (!params) return "Feature params unavailable.";
      const parsed = parseUnitInterval(value);
      if (parsed === undefined) return "Enter a number between 0 and 1.";
      overrideParams({ ...params, discount: parsed });
      return undefined;
    },
    [overrideParams, params],
  );

  const handleApplyOnboardingDate = useCallback(
    (value: string) => {
      const date = parseDateOrOffset(value);
      if (!date) return "Invalid date or offset.";
      dispatch(setPostOnboardingDate({ onboardingDate: date }));
      return undefined;
    },
    [dispatch],
  );

  const handleSetOnboardingDateNull = useCallback(() => {
    dispatch(setPostOnboardingDate({ onboardingDate: null }));
  }, [dispatch]);

  const handleApplyRetries = useCallback(
    (value: string) => {
      const parsed = parseNonNegativeInteger(value);
      if (parsed === undefined) return "Enter a non-negative integer.";
      dispatch(setUpsellModalRetries(parsed));
      return undefined;
    },
    [dispatch],
  );

  const handleResetRetries = useCallback(() => {
    dispatch(resetUpsellModalRetries());
  }, [dispatch]);

  const handleApplyLastSeen = useCallback(
    (value: string) => {
      const date = parseDateOrOffset(value);
      if (!date) return "Invalid date or offset.";
      dispatch(setLastSeenUpsellModal(date.getTime()));
      return undefined;
    },
    [dispatch],
  );

  const handleSetLastSeenNull = useCallback(() => {
    dispatch(setLastSeenUpsellModal(null));
  }, [dispatch]);

  const handleClosePreview = useCallback(() => {
    setIsPreviewOpen(false);
  }, []);

  const handleOpenPreview = useCallback(() => {
    setIsPreviewOpen(true);
  }, []);

  const handleTogglePreviewVariant = useCallback((optedIn: boolean) => {
    setPreviewVariant(optedIn ? "opted_in" : "opted_out");
  }, []);

  const previewViewModel = useMemo<FeatureIntroViewModel | null>(() => {
    if (!params) return null;
    return {
      content: buildLargeScreenUpsellContent({
        id: PREVIEW_MODAL_ID,
        variant: previewVariant,
        discount: params.discount,
        optedInLink: params.opted_in.link,
        optedOutLink: params.opted_out.link,
        t,
      }),
      onPrimaryPress: handleClosePreview,
      onSecondaryPress: handleClosePreview,
    };
  }, [params, previewVariant, t, handleClosePreview]);

  return {
    wouldShow,
    isFlagEnabled,
    modalEnabled,
    discountValue: params?.discount != null ? String(params.discount) : "",
    killThresholdValue: killThreshold != null ? String(killThreshold) : "",
    cadenceDaysValue: cadenceDays != null ? String(cadenceDays) : "",
    cooldownDaysDefaultValue: cooldownDaysDefault != null ? String(cooldownDaysDefault) : "",
    resolvedCooldownDaysValue: resolvedCooldownDays != null ? String(resolvedCooldownDays) : "-",
    handleToggleModalEnabled,
    handleApplyKillThreshold,
    handleApplyCadenceDays,
    handleApplyCooldownDays,
    handleApplyDiscount,
    breakdown: {
      audienceOk,
      audienceHint,
      cooldownOk,
      cooldownHint: `Onboarding + ${resolvedCooldownDays ?? "?"} day(s).`,
      notThrottledOk,
      throttleHint: `Kill threshold ${killThreshold ?? "?"} within ${cadenceDays ?? "?"} day(s).`,
    },
    onboardingDateValue: toIso(onboardingDate),
    onboardingDateHint: `Now: ${toIso(onboardingDate) || "null"} — enter an ISO date or a day offset (today = 0, yesterday = 1).`,
    retriesValue: String(retries),
    retriesHint: `Now: ${retries}. Set to ${killThreshold ?? "?"}+ to reach the kill threshold.`,
    lastSeenValue: toIso(lastSeenDate),
    lastSeenHint: `Now: ${toIso(lastSeenDate) || "null"} — enter an ISO date or a day offset (today = 0, yesterday = 1).`,
    handleToggleFlag,
    handleApplyOnboardingDate,
    handleSetOnboardingDateNull,
    handleApplyRetries,
    handleResetRetries,
    handleApplyLastSeen,
    handleSetLastSeenNull,
    isPreviewOpen,
    isPreviewOptedIn: previewVariant === "opted_in",
    previewVariantHint:
      previewVariant === "opted_in"
        ? "Opted-in copy (analytics on). Toggle off for the opted-out copy."
        : "Opted-out copy (analytics off). Toggle on for the opted-in copy.",
    canPreview: previewViewModel != null,
    previewViewModel,
    previewBottomInset: bottom + PREVIEW_IOS_BOTTOM_PADDING,
    handleOpenPreview,
    handleClosePreview,
    handleTogglePreviewVariant,
  };
}
