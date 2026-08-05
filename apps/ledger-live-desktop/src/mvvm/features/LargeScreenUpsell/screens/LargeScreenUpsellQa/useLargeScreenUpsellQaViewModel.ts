import { useState } from "react";
import { useNavigate } from "react-router";
import { DeviceModelId } from "@ledgerhq/devices";
import { useFeature } from "@features/platform-feature-flags";
import {
  FEATURE_FLAGS_DEFAULTS,
  featureFlagsOverridesSelector,
  setOverride,
} from "@shared/feature-flags";
import { onboardingDateSelector } from "@ledgerhq/live-common/postOnboarding/reducer";
import { setPostOnboardingDate } from "@ledgerhq/live-common/postOnboarding/actions";
import {
  getLargeScreenUpsellDecision,
  lastSeenUpsellModalSelector,
  mapDevicesModelListToUpsellInputs,
  resetUpsellModalRetries,
  retriesUpsellModalSelector,
  setLastSeenUpsellModal,
  setUpsellModalRetries,
} from "@features/flow-large-screen-upsell";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { saveSettings, setSharePersonalizedRecommendations } from "~/renderer/actions/settings";
import {
  devicesModelListSelector,
  sharePersonalizedRecommendationsSelector,
} from "~/renderer/reducers/settings";
import {
  buildUpsellGateRows,
  daysAgoDate,
  draftDisplayFromEffective,
  isPostOnboardingCooldownPassed,
  isThrottleGatePassed,
  parseNonNegativeInteger,
  pastCooldownOffsetDays,
  resolveParamBaseline,
} from "./utils";
import { COPY, formatLastSeenDisplay, formatOnboardingDisplay, GATE_LABELS } from "./copy";

const FLAG_KEY = "largeScreenUpsell";

export const QA_NANO_MODELS = [
  { id: DeviceModelId.nanoS, labelKey: "nanoS" },
  { id: DeviceModelId.nanoSP, labelKey: "nanoSP" },
  { id: DeviceModelId.nanoX, labelKey: "nanoX" },
] as const;

export const QA_TOUCHSCREEN_MODELS = [
  { id: DeviceModelId.stax, labelKey: "stax" },
  { id: DeviceModelId.europa, labelKey: "europa" },
  { id: DeviceModelId.apex, labelKey: "apex" },
] as const;

function handleReload() {
  window.api?.reloadRenderer();
}

export function useLargeScreenUpsellQaViewModel() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const feature = useFeature(FLAG_KEY);
  const overrides = useSelector(featureFlagsOverridesSelector);
  const hasLocalOverride = overrides[FLAG_KEY] !== undefined;
  const schemaDefaults = FEATURE_FLAGS_DEFAULTS[FLAG_KEY];
  const devicesModelList = useSelector(devicesModelListSelector);
  const personalizedRecommendationsEnabled = useSelector(sharePersonalizedRecommendationsSelector);
  const onboardingDate = useSelector(onboardingDateSelector);
  const retries = useSelector(retriesUpsellModalSelector);
  const lastSeenAt = useSelector(lastSeenUpsellModalSelector);

  const params = feature?.params;
  const isFeatureEnabled = Boolean(feature?.enabled) && params !== undefined;
  const killThreshold = params?.modal?.killThreshold;
  const isModalEnabled = Boolean(params?.modal?.enabled);

  const killThresholdBaseline = resolveParamBaseline({
    effective: params?.modal?.killThreshold,
    schemaDefault: schemaDefaults.params?.modal.killThreshold,
    hasLocalOverride,
  });
  const cooldownDefaultBaseline = resolveParamBaseline({
    effective: params?.cooldownDays?.default,
    schemaDefault: schemaDefaults.params?.cooldownDays.default,
    hasLocalOverride,
  });
  const cooldownNanoSBaseline = resolveParamBaseline({
    effective: params?.cooldownDays?.nanoS,
    schemaDefault: schemaDefaults.params?.cooldownDays.nanoS ?? 0,
    hasLocalOverride,
  });
  const cooldownNanoSPBaseline = resolveParamBaseline({
    effective: params?.cooldownDays?.nanoSP,
    schemaDefault: schemaDefaults.params?.cooldownDays.nanoSP,
    hasLocalOverride,
  });
  const cooldownNanoXBaseline = resolveParamBaseline({
    effective: params?.cooldownDays?.nanoX,
    schemaDefault: schemaDefaults.params?.cooldownDays.nanoX,
    hasLocalOverride,
  });
  const cadenceDaysBaseline = resolveParamBaseline({
    effective: params?.modal?.cadenceDays,
    schemaDefault: schemaDefaults.params?.modal.cadenceDays,
    hasLocalOverride,
  });

  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [draftKillThreshold, setDraftKillThreshold] = useState(() =>
    draftDisplayFromEffective(params?.modal?.killThreshold, killThresholdBaseline.baseline),
  );
  const [draftCooldownDefault, setDraftCooldownDefault] = useState(() =>
    draftDisplayFromEffective(params?.cooldownDays?.default, cooldownDefaultBaseline.baseline),
  );
  const [draftCooldownNanoS, setDraftCooldownNanoS] = useState(() =>
    draftDisplayFromEffective(params?.cooldownDays?.nanoS, cooldownNanoSBaseline.baseline),
  );
  const [draftCooldownNanoSP, setDraftCooldownNanoSP] = useState(() =>
    draftDisplayFromEffective(params?.cooldownDays?.nanoSP, cooldownNanoSPBaseline.baseline),
  );
  const [draftCooldownNanoX, setDraftCooldownNanoX] = useState(() =>
    draftDisplayFromEffective(params?.cooldownDays?.nanoX, cooldownNanoXBaseline.baseline),
  );
  const [draftCadenceDays, setDraftCadenceDays] = useState(() =>
    draftDisplayFromEffective(params?.modal?.cadenceDays, cadenceDaysBaseline.baseline),
  );

  const { seenNanoModelIds, hasSeenTouchscreenDevice } =
    mapDevicesModelListToUpsellInputs(devicesModelList);
  const isNanoSeen = seenNanoModelIds.length > 0;
  const now = new Date();

  const nanoModelRows = QA_NANO_MODELS.map(model => ({
    id: model.id,
    label: COPY[model.labelKey],
    checked: devicesModelList.includes(model.id),
  }));

  const touchscreenModelRows = QA_TOUCHSCREEN_MODELS.map(model => ({
    id: model.id,
    label: COPY[model.labelKey],
    checked: devicesModelList.includes(model.id),
  }));

  // Missing params → feature_disabled (same early gate as production; no invented defaults).
  const decision = !params
    ? { shouldShow: false as const, reason: "feature_disabled" as const }
    : getLargeScreenUpsellDecision(
        {
          seenNanoModelIds,
          hasSeenTouchscreenDevice,
          onboardingDate,
          frequency: { retries, lastSeenAt },
        },
        {
          isFeatureEnabled,
          isModalEnabled,
          audienceModels: params.audience.models,
          cooldownDays: params.cooldownDays,
          killThreshold: params.modal.killThreshold,
          cadenceDays: params.modal.cadenceDays,
          now,
        },
      );

  const wouldShow = decision.shouldShow;

  const enabledSeenNanoModelIds = params
    ? seenNanoModelIds.filter(id => params.audience.models[id])
    : [];
  const isModelInAudience = enabledSeenNanoModelIds.length > 0;

  const deviceModelIdForCooldown =
    "deviceModelId" in decision ? decision.deviceModelId : enabledSeenNanoModelIds[0];
  let resolvedCooldownDays: number | undefined;
  if (params == null) {
    resolvedCooldownDays = undefined;
  } else if (deviceModelIdForCooldown != null) {
    resolvedCooldownDays =
      params.cooldownDays[deviceModelIdForCooldown] ?? params.cooldownDays.default;
  } else {
    resolvedCooldownDays = params.cooldownDays.default;
  }

  const cooldownPassed =
    resolvedCooldownDays != null &&
    isPostOnboardingCooldownPassed({
      onboardingDate,
      cooldownDays: resolvedCooldownDays,
      now,
    });

  const throttlePassed =
    params == null ||
    isThrottleGatePassed({
      retries,
      lastSeenAt,
      killThreshold: params.modal.killThreshold,
      cadenceDays: params.modal.cadenceDays,
      now,
    });

  const throttleNeedsLastSeenHint =
    params != null && retries >= params.modal.killThreshold && lastSeenAt == null;

  const gateRows = buildUpsellGateRows({
    isFeatureEnabled,
    isModalEnabled,
    hasSeenTouchscreenDevice,
    hasNano: isNanoSeen,
    isModelInAudience: !isNanoSeen || isModelInAudience,
    cooldownPassed,
    throttlePassed,
    blockingReason: decision.shouldShow ? undefined : decision.reason,
  }).map(row => {
    const baseLabel = GATE_LABELS.find(g => g.reason === row.reason)?.label ?? row.reason;
    const label =
      row.reason === "throttled" && throttleNeedsLastSeenHint
        ? `${baseLabel}${COPY.throttleNeedsLastSeen}`
        : baseLabel;
    return { ...row, label };
  });

  const onboardingDisplay = formatOnboardingDisplay(onboardingDate);
  const pastCooldownDays = pastCooldownOffsetDays(
    resolvedCooldownDays ?? params?.cooldownDays.default ?? 0,
  );
  const pastCooldownLabel = COPY.onboardingPastCooldown(pastCooldownDays);

  function overrideFeature(next: NonNullable<typeof feature>) {
    dispatch(setOverride({ key: FLAG_KEY, value: next }));
  }

  function handleBack() {
    navigate("/settings/developer");
  }

  function handleToggleFeature(enabled: boolean) {
    if (!feature) return;
    overrideFeature({ ...feature, enabled });
  }

  function handleTogglePersonalizedRecommendations(enabled: boolean) {
    dispatch(setSharePersonalizedRecommendations(enabled));
  }

  function handleToggleModalEnabled(enabled: boolean) {
    if (!feature || !params) return;
    overrideFeature({
      ...feature,
      params: { ...params, modal: { ...params.modal, enabled } },
    });
  }

  function handleToggleDeviceModel(modelId: DeviceModelId, seen: boolean) {
    if (seen) {
      const next = devicesModelList.includes(modelId)
        ? devicesModelList
        : [...devicesModelList, modelId];
      dispatch(saveSettings({ devicesModelList: next }));
      return;
    }

    dispatch(
      saveSettings({
        devicesModelList: devicesModelList.filter(id => id !== modelId),
      }),
    );
  }

  function handleSetOnboardingDaysAgo(days: number) {
    dispatch(setPostOnboardingDate({ onboardingDate: daysAgoDate(days) }));
  }

  function handleSetOnboardingPastCooldown() {
    handleSetOnboardingDaysAgo(pastCooldownDays);
  }

  function handleClearOnboardingDate() {
    dispatch(setPostOnboardingDate({ onboardingDate: null }));
  }

  function handleDecrementRetries() {
    dispatch(setUpsellModalRetries(Math.max(0, retries - 1)));
  }

  function handleIncrementRetries() {
    dispatch(setUpsellModalRetries(retries + 1));
  }

  function handleResetRetries() {
    dispatch(resetUpsellModalRetries());
  }

  function handleClearLastSeen() {
    dispatch(setLastSeenUpsellModal(null));
  }

  function handleSetLastSeenNow() {
    dispatch(setLastSeenUpsellModal(Date.now()));
  }

  function handleApplyKillThreshold() {
    if (!feature || !params) return;
    const parsed = parseNonNegativeInteger(draftKillThreshold);
    if (parsed === undefined) return;
    overrideFeature({
      ...feature,
      params: { ...params, modal: { ...params.modal, killThreshold: parsed } },
    });
    setDraftKillThreshold(draftDisplayFromEffective(parsed, killThresholdBaseline.baseline));
  }

  function handleApplyCooldownDefault() {
    if (!feature || !params) return;
    const parsed = parseNonNegativeInteger(draftCooldownDefault);
    if (parsed === undefined) return;
    overrideFeature({
      ...feature,
      params: {
        ...params,
        cooldownDays: { ...params.cooldownDays, default: parsed },
      },
    });
    setDraftCooldownDefault(draftDisplayFromEffective(parsed, cooldownDefaultBaseline.baseline));
  }

  function handleApplyCooldownNanoS() {
    if (!feature || !params) return;
    const parsed = parseNonNegativeInteger(draftCooldownNanoS);
    if (parsed === undefined) return;
    overrideFeature({
      ...feature,
      params: {
        ...params,
        cooldownDays: { ...params.cooldownDays, nanoS: parsed },
      },
    });
    setDraftCooldownNanoS(draftDisplayFromEffective(parsed, cooldownNanoSBaseline.baseline));
  }

  function handleApplyCooldownNanoSP() {
    if (!feature || !params) return;
    const parsed = parseNonNegativeInteger(draftCooldownNanoSP);
    if (parsed === undefined) return;
    overrideFeature({
      ...feature,
      params: {
        ...params,
        cooldownDays: { ...params.cooldownDays, nanoSP: parsed },
      },
    });
    setDraftCooldownNanoSP(draftDisplayFromEffective(parsed, cooldownNanoSPBaseline.baseline));
  }

  function handleApplyCooldownNanoX() {
    if (!feature || !params) return;
    const parsed = parseNonNegativeInteger(draftCooldownNanoX);
    if (parsed === undefined) return;
    overrideFeature({
      ...feature,
      params: {
        ...params,
        cooldownDays: { ...params.cooldownDays, nanoX: parsed },
      },
    });
    setDraftCooldownNanoX(draftDisplayFromEffective(parsed, cooldownNanoXBaseline.baseline));
  }

  function handleApplyCadenceDays() {
    if (!feature || !params) return;
    const parsed = parseNonNegativeInteger(draftCadenceDays);
    if (parsed === undefined) return;
    overrideFeature({
      ...feature,
      params: { ...params, modal: { ...params.modal, cadenceDays: parsed } },
    });
    setDraftCadenceDays(draftDisplayFromEffective(parsed, cadenceDaysBaseline.baseline));
  }

  /** Restore one FF param to baseline inside the full-flag override (no per-key clear API). */
  function handleResetKillThreshold() {
    if (!feature || !params) return;
    const value = killThresholdBaseline.baselineValue;
    if (value === undefined || value === null) return;
    if (hasLocalOverride) {
      overrideFeature({
        ...feature,
        params: { ...params, modal: { ...params.modal, killThreshold: value } },
      });
    }
    setDraftKillThreshold("");
  }

  function handleResetCooldownDefault() {
    if (!feature || !params) return;
    const value = cooldownDefaultBaseline.baselineValue;
    if (value === undefined || value === null) return;
    if (hasLocalOverride) {
      overrideFeature({
        ...feature,
        params: {
          ...params,
          cooldownDays: { ...params.cooldownDays, default: value },
        },
      });
    }
    setDraftCooldownDefault("");
  }

  function handleResetCooldownNanoS() {
    if (!feature || !params) return;
    const value = cooldownNanoSBaseline.baselineValue;
    if (hasLocalOverride) {
      overrideFeature({
        ...feature,
        params: {
          ...params,
          cooldownDays: { ...params.cooldownDays, nanoS: value },
        },
      });
    }
    setDraftCooldownNanoS("");
  }

  function handleResetCooldownNanoSP() {
    if (!feature || !params) return;
    const value = cooldownNanoSPBaseline.baselineValue;
    if (hasLocalOverride) {
      overrideFeature({
        ...feature,
        params: {
          ...params,
          cooldownDays: { ...params.cooldownDays, nanoSP: value },
        },
      });
    }
    setDraftCooldownNanoSP("");
  }

  function handleResetCooldownNanoX() {
    if (!feature || !params) return;
    const value = cooldownNanoXBaseline.baselineValue;
    if (hasLocalOverride) {
      overrideFeature({
        ...feature,
        params: {
          ...params,
          cooldownDays: { ...params.cooldownDays, nanoX: value },
        },
      });
    }
    setDraftCooldownNanoX("");
  }

  function handleResetCadenceDays() {
    if (!feature || !params) return;
    const value = cadenceDaysBaseline.baselineValue;
    if (value === undefined || value === null) return;
    if (hasLocalOverride) {
      overrideFeature({
        ...feature,
        params: { ...params, modal: { ...params.modal, cadenceDays: value } },
      });
    }
    setDraftCadenceDays("");
  }

  function handleResetAllFlagParams() {
    dispatch(setOverride({ key: FLAG_KEY, value: undefined }));
    setDraftKillThreshold("");
    setDraftCooldownDefault("");
    setDraftCooldownNanoS("");
    setDraftCooldownNanoSP("");
    setDraftCooldownNanoX("");
    setDraftCadenceDays("");
  }

  function handleToggleAdvanced() {
    setIsAdvancedOpen(open => !open);
  }

  return {
    wouldShow,
    copyVariant: personalizedRecommendationsEnabled
      ? COPY.copyVariantOptIn
      : COPY.copyVariantOptOut,
    onboardingDisplay,
    pastCooldownLabel,
    gateRows,
    retriesDisplay: String(retries),
    lastSeenDisplay: formatLastSeenDisplay(lastSeenAt),
    isFeatureEnabled: feature?.enabled ?? false,
    personalizedRecommendationsEnabled,
    isModalEnabled,
    nanoModelRows,
    touchscreenModelRows,
    isAdvancedOpen,
    draftKillThreshold,
    draftCooldownDefault,
    draftCooldownNanoS,
    draftCooldownNanoSP,
    draftCooldownNanoX,
    draftCadenceDays,
    killThresholdValue: killThreshold != null ? String(killThreshold) : "-",
    killThresholdLabel: COPY.killThresholdEdit,
    cooldownDefaultLabel: COPY.cooldownDefaultEdit,
    cooldownNanoSLabel: COPY.cooldownNanoSEdit,
    cooldownNanoSPLabel: COPY.cooldownNanoSPEdit,
    cooldownNanoXLabel: COPY.cooldownNanoXEdit,
    cadenceDaysLabel: COPY.cadenceDaysEdit,
    modalEnabledLabel: COPY.popupEnabled,
    killThresholdPlaceholder: killThresholdBaseline.baseline,
    cooldownDefaultPlaceholder: cooldownDefaultBaseline.baseline,
    cooldownNanoSPlaceholder: cooldownNanoSBaseline.baseline,
    cooldownNanoSPPlaceholder: cooldownNanoSPBaseline.baseline,
    cooldownNanoXPlaceholder: cooldownNanoXBaseline.baseline,
    cadenceDaysPlaceholder: cadenceDaysBaseline.baseline,
    killThresholdOverridden: killThresholdBaseline.isOverridden,
    cooldownDefaultOverridden: cooldownDefaultBaseline.isOverridden,
    cooldownNanoSOverridden: cooldownNanoSBaseline.isOverridden,
    cooldownNanoSPOverridden: cooldownNanoSPBaseline.isOverridden,
    cooldownNanoXOverridden: cooldownNanoXBaseline.isOverridden,
    cadenceDaysOverridden: cadenceDaysBaseline.isOverridden,
    hasLocalOverride,
    canEditFlagParams: Boolean(feature && params),
    handleBack,
    handleReload,
    handleToggleFeature,
    handleTogglePersonalizedRecommendations,
    handleToggleDeviceModel,
    handleToggleAdvanced,
    handleToggleModalEnabled,
    handleSetOnboardingDaysAgo,
    handleSetOnboardingPastCooldown,
    handleClearOnboardingDate,
    handleDecrementRetries,
    handleIncrementRetries,
    handleResetRetries,
    handleSetLastSeenNow,
    handleClearLastSeen,
    setDraftKillThreshold,
    handleApplyKillThreshold,
    handleResetKillThreshold,
    setDraftCooldownDefault,
    handleApplyCooldownDefault,
    handleResetCooldownDefault,
    setDraftCooldownNanoS,
    handleApplyCooldownNanoS,
    handleResetCooldownNanoS,
    setDraftCooldownNanoSP,
    handleApplyCooldownNanoSP,
    handleResetCooldownNanoSP,
    setDraftCooldownNanoX,
    handleApplyCooldownNanoX,
    handleResetCooldownNanoX,
    setDraftCadenceDays,
    handleApplyCadenceDays,
    handleResetCadenceDays,
    handleResetAllFlagParams,
  };
}

export type LargeScreenUpsellQaViewModel = ReturnType<typeof useLargeScreenUpsellQaViewModel>;
