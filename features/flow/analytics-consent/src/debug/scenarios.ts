import {
  parsePolicyVersion,
  type AnalyticsConsentInfo,
  type PolicyVersion,
} from "@domain/entity-analytics-consent";

export const INVALID_POLICY_VERSION = "not-a-version";

/** Fallback when live remote policyVersion is missing or invalid. */
export const SYNTHETIC_BASELINE: PolicyVersion = {
  major: 1,
  minor: 0,
  normalized: "1.0",
};

export type QaExpectation = "Re-ask" | "Ack only" | "Quiet";

export type RemotePolicyRef = "matchBaseline" | "nextMinor" | "nextMajor" | "invalid";
/** `"keep"` leaves the device's saved policy version untouched when applying the scenario. */
export type StoredPolicyRef = "matchBaseline" | "nextMajor" | "corrupt" | "legacyFloat" | "keep";

export type QaScenario = {
  id: string;
  name: string;
  expected: QaExpectation;
  /** Short card + confirm copy; versions are relative to live remote baseline. */
  summary: string;
  remotePolicy: RemotePolicyRef;
  storedPolicy: StoredPolicyRef;
  /** `daysAgo` is resolved against the current clock; the other kinds cover corrupted state. */
  consentDate: { kind: "daysAgo"; days: number } | { kind: "null" } | { kind: "invalid" };
  analyticsEnabled: boolean;
  hasSeenPrompt: boolean;
};

export const QA_SCENARIOS: QaScenario[] = [
  {
    id: "up-to-date",
    name: "Up to date",
    expected: "Quiet",
    summary: "Policy matches consent → no drawer",
    remotePolicy: "matchBaseline",
    storedPolicy: "matchBaseline",
    consentDate: { kind: "daysAgo", days: 28 },
    analyticsEnabled: true,
    hasSeenPrompt: true,
  },
  {
    id: "minor-bump",
    name: "Minor update",
    expected: "Ack only",
    summary: "Small policy change → privacy ack",
    remotePolicy: "nextMinor",
    storedPolicy: "matchBaseline",
    consentDate: { kind: "daysAgo", days: 28 },
    analyticsEnabled: true,
    hasSeenPrompt: true,
  },
  {
    id: "major-bump",
    name: "Major update",
    expected: "Re-ask",
    summary: "Big policy change → full reconsent",
    remotePolicy: "nextMajor",
    storedPolicy: "matchBaseline",
    consentDate: { kind: "daysAgo", days: 28 },
    analyticsEnabled: true,
    hasSeenPrompt: true,
  },
  {
    id: "first-time",
    name: "No consent",
    expected: "Re-ask",
    summary: "Clears consent date only → full reconsent",
    remotePolicy: "matchBaseline",
    storedPolicy: "keep",
    consentDate: { kind: "null" },
    analyticsEnabled: false,
    hasSeenPrompt: false,
  },
  {
    // Consent no longer expires on a timer, so an old date must stay silent.
    id: "old-date",
    name: "Old consent",
    expected: "Quiet",
    summary: "Old date, same policy → no drawer",
    remotePolicy: "matchBaseline",
    storedPolicy: "matchBaseline",
    consentDate: { kind: "daysAgo", days: 400 },
    analyticsEnabled: true,
    hasSeenPrompt: true,
  },
  {
    id: "date-corrupt",
    name: "Bad date",
    expected: "Re-ask",
    summary: "Unreadable date → full reconsent",
    remotePolicy: "matchBaseline",
    storedPolicy: "matchBaseline",
    consentDate: { kind: "invalid" },
    analyticsEnabled: true,
    hasSeenPrompt: true,
  },
  {
    id: "stored-corrupt",
    name: "Bad version",
    expected: "Re-ask",
    summary: "Unreadable saved version → full reconsent",
    remotePolicy: "matchBaseline",
    storedPolicy: "corrupt",
    consentDate: { kind: "daysAgo", days: 28 },
    analyticsEnabled: true,
    hasSeenPrompt: true,
  },
  {
    id: "config-invalid",
    name: "Bad config",
    expected: "Quiet",
    summary: "Invalid server version → no drawer",
    remotePolicy: "invalid",
    storedPolicy: "matchBaseline",
    consentDate: { kind: "daysAgo", days: 28 },
    analyticsEnabled: true,
    hasSeenPrompt: true,
  },
  {
    id: "stored-ahead",
    name: "Device ahead",
    expected: "Quiet",
    summary: "Device newer than server → no drawer",
    remotePolicy: "matchBaseline",
    storedPolicy: "nextMajor",
    consentDate: { kind: "daysAgo", days: 28 },
    analyticsEnabled: true,
    hasSeenPrompt: true,
  },
  {
    id: "legacy-float",
    name: "Legacy format",
    expected: "Quiet",
    summary: "Number stored as version → no drawer",
    remotePolicy: "nextMinor",
    storedPolicy: "legacyFloat",
    consentDate: { kind: "daysAgo", days: 28 },
    analyticsEnabled: true,
    hasSeenPrompt: true,
  },
];

export const INVALID_CONSENT_DATE = "yesterday";
const MS_PER_DAY = 86_400_000;

export function resolveBaselinePolicyVersion(rawRemote: unknown): PolicyVersion {
  return parsePolicyVersion(rawRemote) ?? SYNTHETIC_BASELINE;
}

function bumpMinor(version: PolicyVersion): PolicyVersion {
  const minor = version.minor + 1;
  return { major: version.major, minor, normalized: `${version.major}.${minor}` };
}

function bumpMajor(version: PolicyVersion): PolicyVersion {
  const major = version.major + 1;
  return { major, minor: version.minor, normalized: `${major}.${version.minor}` };
}

export function resolveScenarioVersions(
  scenario: Pick<QaScenario, "remotePolicy" | "storedPolicy">,
  baseline: PolicyVersion,
): {
  policyVersion: number | string;
  /** `undefined` means leave the device's saved policy version unchanged. */
  storedVersion: AnalyticsConsentInfo["privacyPolicyVersion"] | undefined;
} {
  const policyVersion = (() => {
    switch (scenario.remotePolicy) {
      case "matchBaseline":
        return baseline.normalized;
      case "nextMinor":
        return bumpMinor(baseline).normalized;
      case "nextMajor":
        return bumpMajor(baseline).normalized;
      case "invalid":
        return INVALID_POLICY_VERSION;
    }
  })();

  const storedVersion = (() => {
    switch (scenario.storedPolicy) {
      case "keep":
        return undefined;
      case "matchBaseline":
        return baseline.normalized;
      case "nextMajor":
        return bumpMajor(baseline).normalized;
      case "corrupt":
        return "v2";
      case "legacyFloat":
        return Number(bumpMinor(baseline).normalized);
    }
  })();

  return { policyVersion, storedVersion };
}

export function resolveScenarioConsentDate(
  consentDate: QaScenario["consentDate"],
  now: Date,
): string | null {
  switch (consentDate.kind) {
    case "null":
      return null;
    case "invalid":
      return INVALID_CONSENT_DATE;
    case "daysAgo":
      return new Date(now.getTime() - consentDate.days * MS_PER_DAY).toISOString();
  }
}
