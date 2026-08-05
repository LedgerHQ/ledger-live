import {
  INVALID_CONSENT_DATE,
  INVALID_POLICY_VERSION,
  QA_SCENARIOS,
  resolveScenarioConsentDate,
  resolveScenarioVersions,
  SYNTHETIC_BASELINE,
  type QaExpectation,
  type QaScenario,
  type RemotePolicyRef,
  type StoredPolicyRef,
} from "./scenarios";

const CUSTOM_BASELINE = { major: 2, minor: 3, normalized: "2.3" } as const;

describe("QA_SCENARIOS", () => {
  const catalogInvariants: Array<{
    id: string;
    name: string;
    expected: QaExpectation;
    remotePolicy: RemotePolicyRef;
    storedPolicy: StoredPolicyRef;
    consentDateKind: QaScenario["consentDate"]["kind"];
    analyticsEnabled: boolean;
    hasSeenPrompt: boolean;
  }> = [
    {
      id: "up-to-date",
      name: "Up to date",
      expected: "Quiet",
      remotePolicy: "matchBaseline",
      storedPolicy: "matchBaseline",
      consentDateKind: "daysAgo",
      analyticsEnabled: true,
      hasSeenPrompt: true,
    },
    {
      id: "minor-bump",
      name: "Minor update",
      expected: "Ack only",
      remotePolicy: "nextMinor",
      storedPolicy: "matchBaseline",
      consentDateKind: "daysAgo",
      analyticsEnabled: true,
      hasSeenPrompt: true,
    },
    {
      id: "major-bump",
      name: "Major update",
      expected: "Re-ask",
      remotePolicy: "nextMajor",
      storedPolicy: "matchBaseline",
      consentDateKind: "daysAgo",
      analyticsEnabled: true,
      hasSeenPrompt: true,
    },
    {
      id: "first-time",
      name: "No consent",
      expected: "Re-ask",
      remotePolicy: "matchBaseline",
      storedPolicy: "keep",
      consentDateKind: "null",
      analyticsEnabled: false,
      hasSeenPrompt: false,
    },
    {
      id: "old-date",
      name: "Old consent",
      expected: "Quiet",
      remotePolicy: "matchBaseline",
      storedPolicy: "matchBaseline",
      consentDateKind: "daysAgo",
      analyticsEnabled: true,
      hasSeenPrompt: true,
    },
    {
      id: "date-corrupt",
      name: "Bad date",
      expected: "Re-ask",
      remotePolicy: "matchBaseline",
      storedPolicy: "matchBaseline",
      consentDateKind: "invalid",
      analyticsEnabled: true,
      hasSeenPrompt: true,
    },
    {
      id: "stored-corrupt",
      name: "Bad version",
      expected: "Re-ask",
      remotePolicy: "matchBaseline",
      storedPolicy: "corrupt",
      consentDateKind: "daysAgo",
      analyticsEnabled: true,
      hasSeenPrompt: true,
    },
    {
      id: "config-invalid",
      name: "Bad config",
      expected: "Quiet",
      remotePolicy: "invalid",
      storedPolicy: "matchBaseline",
      consentDateKind: "daysAgo",
      analyticsEnabled: true,
      hasSeenPrompt: true,
    },
    {
      id: "stored-ahead",
      name: "Device ahead",
      expected: "Quiet",
      remotePolicy: "matchBaseline",
      storedPolicy: "nextMajor",
      consentDateKind: "daysAgo",
      analyticsEnabled: true,
      hasSeenPrompt: true,
    },
    {
      id: "legacy-float",
      name: "Legacy format",
      expected: "Quiet",
      remotePolicy: "nextMinor",
      storedPolicy: "legacyFloat",
      consentDateKind: "daysAgo",
      analyticsEnabled: true,
      hasSeenPrompt: true,
    },
  ];

  it("contains every catalog scenario with stable ids and verdicts", () => {
    expect(QA_SCENARIOS).toHaveLength(catalogInvariants.length);
    expect(new Set(QA_SCENARIOS.map(scenario => scenario.id)).size).toBe(catalogInvariants.length);
  });

  it.each(catalogInvariants)(
    "scenario $id exposes the expected QA shape",
    ({
      id,
      name,
      expected,
      remotePolicy,
      storedPolicy,
      consentDateKind,
      analyticsEnabled,
      hasSeenPrompt,
    }) => {
      const scenario = QA_SCENARIOS.find(entry => entry.id === id);

      expect(scenario).toMatchObject({
        id,
        name,
        expected,
        remotePolicy,
        storedPolicy,
        analyticsEnabled,
        hasSeenPrompt,
      });
      expect(scenario?.summary.length).toBeGreaterThan(0);
      expect(scenario?.consentDate.kind).toBe(consentDateKind);
    },
  );

  it("uses keep storedPolicy and null consent date only for first-time", () => {
    expect(QA_SCENARIOS.filter(scenario => scenario.storedPolicy === "keep")).toEqual([
      expect.objectContaining({ id: "first-time" }),
    ]);
    expect(QA_SCENARIOS.filter(scenario => scenario.consentDate.kind === "null")).toEqual([
      expect.objectContaining({ id: "first-time" }),
    ]);
  });
});

describe("resolveScenarioVersions", () => {
  it.each([
    {
      remotePolicy: "matchBaseline" as const,
      expectedPolicyVersion: CUSTOM_BASELINE.normalized,
    },
    { remotePolicy: "nextMinor" as const, expectedPolicyVersion: "2.4" },
    { remotePolicy: "nextMajor" as const, expectedPolicyVersion: "3.3" },
    { remotePolicy: "invalid" as const, expectedPolicyVersion: INVALID_POLICY_VERSION },
  ])(
    "remotePolicy $remotePolicy resolves policyVersion",
    ({ remotePolicy, expectedPolicyVersion }) => {
      expect(
        resolveScenarioVersions({ remotePolicy, storedPolicy: "matchBaseline" }, CUSTOM_BASELINE)
          .policyVersion,
      ).toBe(expectedPolicyVersion);
    },
  );

  it.each([
    { storedPolicy: "keep" as const, expectedStoredVersion: undefined },
    { storedPolicy: "matchBaseline" as const, expectedStoredVersion: CUSTOM_BASELINE.normalized },
    { storedPolicy: "nextMajor" as const, expectedStoredVersion: "3.3" },
    { storedPolicy: "corrupt" as const, expectedStoredVersion: "v2" },
    { storedPolicy: "legacyFloat" as const, expectedStoredVersion: 2.4 },
  ])(
    "storedPolicy $storedPolicy resolves storedVersion",
    ({ storedPolicy, expectedStoredVersion }) => {
      expect(
        resolveScenarioVersions({ remotePolicy: "matchBaseline", storedPolicy }, CUSTOM_BASELINE)
          .storedVersion,
      ).toBe(expectedStoredVersion);
    },
  );

  it("leaves storedVersion undefined when storedPolicy is keep", () => {
    expect(
      resolveScenarioVersions(
        { remotePolicy: "matchBaseline", storedPolicy: "keep" },
        SYNTHETIC_BASELINE,
      ),
    ).toEqual({
      policyVersion: "1.0",
      storedVersion: undefined,
    });
  });

  it("resolves an explicit stored policy version", () => {
    expect(
      resolveScenarioVersions(
        { remotePolicy: "nextMinor", storedPolicy: "matchBaseline" },
        SYNTHETIC_BASELINE,
      ),
    ).toEqual({
      policyVersion: "1.1",
      storedVersion: "1.0",
    });
  });
});

describe("resolveScenarioConsentDate", () => {
  const now = new Date("2026-07-31T12:00:00.000Z");

  it("returns null for the null kind", () => {
    expect(resolveScenarioConsentDate({ kind: "null" }, now)).toBeNull();
  });

  it("returns the invalid sentinel for the invalid kind", () => {
    expect(resolveScenarioConsentDate({ kind: "invalid" }, now)).toBe(INVALID_CONSENT_DATE);
  });

  it.each([
    { days: 0, expected: "2026-07-31T12:00:00.000Z" },
    { days: 1, expected: "2026-07-30T12:00:00.000Z" },
    { days: 28, expected: "2026-07-03T12:00:00.000Z" },
    { days: 400, expected: "2025-06-26T12:00:00.000Z" },
  ])("daysAgo $days resolves against the provided clock", ({ days, expected }) => {
    expect(resolveScenarioConsentDate({ kind: "daysAgo", days }, now)).toBe(expected);
  });
});
