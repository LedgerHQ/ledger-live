export const COPY = {
  back: "Back",
  title: "Large-screen upsell",
  willItShow: "Will it show?",
  yes: "YES",
  no: "NO",
  onboardingLegacy: "legacy / none (today)",
  gatesTitle: "Gates (checked in this order)",
  blockingNow: "(blocking)",
  throttleNeedsLastSeen: " (lastSeen unset, not throttled)",
  currentValue: (value: string) => `Now: ${value}`,
  retriesValue: (retries: string, limit: string) => `${retries} / ${limit}`,
  lastSeenNone: "none",
  lastSeenHint: "Throttle needs this when retries ≥ killThreshold. Clear means never shown.",
  lastSeenSetNow: "Set to now",
  reloadHintLead: "Set every gate to pass so Will it show? reads YES.",
  reloadHintRestart: "Opens on Portfolio after reload while you stay eligible.",
  reload: "Reload",
  copyVariantLabel: "Copy variant",
  copyVariantOptIn: "opt-in",
  copyVariantOptOut: "opt-out",
  configure: "Configure",
  featureOn: "Feature on",
  personalizedRecommendations: "Personalized recommendations",
  personalizedRecommendationsExplain:
    "Uses your settings toggle. Opt-in vs opt-out copy applies on the next reload.",
  seenNanos: "Seen Nano models",
  nanoS: "Nano S",
  nanoSP: "Nano SP",
  nanoX: "Nano X",
  seenTouchscreens: "Seen touchscreen models",
  seenTouchscreensHint: "Checking any model fails the No touchscreen seen gate.",
  stax: "Stax",
  europa: "Europa",
  apex: "Apex",
  onboardingDate: "Onboarding date",
  onboardingConfigureHint: "Cooldown counts from this date. Clear means legacy (treated as today).",
  onboardingSevenDaysAgo: "7 days ago",
  onboardingPastCooldown: (days: number) =>
    days === 0 ? "Past cooldown (elapsed)" : `Past cooldown (${days} days ago)`,
  onboardingClearLegacy: "Clear / legacy",
  retriesEdit: "Retries",
  retriesDecrement: "−",
  retriesIncrement: "+",
  lastSeenLabel: "Last seen",
  advanced: "Advanced",
  hideAdvanced: "Hide advanced",
  popupEnabled: "Popup enabled (flag)",
  flagParamsTitle: "Feature flag params",
  flagParamsHint:
    "Edits go into a local flag override. Empty fields show the remote or schema baseline. Reset shows when a value differs from that baseline.",
  resetAllFlagParams: "Reset all",
  killThresholdEdit: "killThreshold",
  killThresholdExplain: "Shows allowed before cadence throttle starts",
  cooldownDefaultEdit: "cooldownDays.default",
  cooldownDefaultExplain: "Days after onboarding before the upsell can show",
  cooldownNanoSEdit: "cooldownDays.nanoS",
  cooldownNanoSExplain: "Days after onboarding before Nano S can see the upsell",
  cooldownNanoSPEdit: "cooldownDays.nanoSP",
  cooldownNanoSPExplain: "Days after onboarding before Nano SP can see the upsell",
  cooldownNanoXEdit: "cooldownDays.nanoX",
  cooldownNanoXExplain: "Days after onboarding before Nano X can see the upsell",
  cadenceDaysEdit: "cadenceDays",
  cadenceDaysExplain: "Days to wait after last show once retries ≥ killThreshold",
  modalEnabledExplain: "Allows the modal when the feature flag is on",
  set: "Set",
  clear: "Clear",
  reset: "Reset",
} as const;

export const GATE_LABELS = [
  { reason: "feature_disabled", label: "Feature on" },
  { reason: "modal_disabled", label: "Popup enabled" },
  { reason: "touchscreen_seen", label: "No touchscreen seen" },
  { reason: "no_nano", label: "Has a Nano" },
  { reason: "model_disabled", label: "Nano model in audience" },
  { reason: "cooldown", label: "Post-onboarding cooldown elapsed" },
  {
    reason: "throttled",
    label: "Not throttled by kill streak",
  },
] as const;

export function formatOnboardingDisplay(onboardingDate: Date | null): string {
  if (onboardingDate == null) return COPY.onboardingLegacy;
  if (Number.isNaN(onboardingDate.getTime())) return COPY.onboardingLegacy;
  return `${onboardingDate.toISOString().slice(0, 16).replace("T", " ")} UTC`;
}

export function formatLastSeenDisplay(lastSeenAt: number | null): string {
  if (lastSeenAt == null) return COPY.lastSeenNone;
  const d = new Date(lastSeenAt);
  if (Number.isNaN(d.getTime())) return COPY.lastSeenNone;
  return `${d.toISOString().slice(0, 16).replace("T", " ")} UTC`;
}
