import { useCallback } from "react";
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
import { useDispatch, useSelector } from "~/context/hooks";
import {
  useLargeScreenUpsellEligibility,
  type LargeScreenUpsellIneligibilityReason,
} from "../hooks/useLargeScreenUpsellEligibility";
import { parseDateOrOffset } from "./utils";

const FLAG_KEY = "largeScreenUpsell";

const INELIGIBILITY_HINTS: Record<LargeScreenUpsellIneligibilityReason, string> = {
  feature_disabled: "Feature flag is off.",
  no_nano: "No Nano device seen on this account.",
  model_disabled: "The seen Nano model is disabled in the flag audience.",
  touchscreen_seen: "A touchscreen device has already been seen.",
  cooldown: "Cooldown has not elapsed yet.",
};

const toIso = (date: Date | null) => (date ? date.toISOString() : "");

export function useLargeScreenUpsellDebugViewModel() {
  const dispatch = useDispatch();
  const feature = useFeature(FLAG_KEY);
  const eligibility = useLargeScreenUpsellEligibility();

  const onboardingDate = useSelector(onboardingDateSelector);
  const retries = useSelector(retriesUpsellModalSelector);
  const lastSeenAt = useSelector(lastSeenUpsellModalSelector);

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
      const trimmed = value.trim();
      const parsed = Number(trimmed);
      if (trimmed === "" || !Number.isSafeInteger(parsed) || parsed < 0) {
        return "Enter a non-negative integer.";
      }
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

  return {
    wouldShow,
    isFlagEnabled,
    modalEnabled,
    killThreshold,
    cadenceDays,
    cooldownDaysDefault,
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
  };
}
