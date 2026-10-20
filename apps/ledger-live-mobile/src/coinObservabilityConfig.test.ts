import { coinObservabilityConfigFor } from "./coinObservabilityConfig";

const flagOn = { enabled: true, params: { syncPathSampleRate: 0.2, maxFailuresPerKey: 3 } };

describe("coinObservabilityConfigFor", () => {
  it("returns the flag's config when bug reporting, Datadog and the flag are all on", () => {
    expect(
      coinObservabilityConfigFor({
        bugReportingEnabled: true,
        datadogEnabled: true,
        coinObservability: flagOn,
      }),
    ).toEqual({ includeSyncPath: true, syncPathSampleRate: 0.2, maxFailuresPerKey: 3 });
  });

  it("sends nothing when the user declined bug reporting, whatever analytics allows", () => {
    expect(
      coinObservabilityConfigFor({
        bugReportingEnabled: false,
        datadogEnabled: true,
        coinObservability: flagOn,
      }),
    ).toBeNull();
  });

  it("sends nothing when the Datadog flag is off", () => {
    expect(
      coinObservabilityConfigFor({
        bugReportingEnabled: true,
        datadogEnabled: false,
        coinObservability: flagOn,
      }),
    ).toBeNull();
  });

  it("sends nothing when the coinObservability flag is off or missing", () => {
    expect(
      coinObservabilityConfigFor({
        bugReportingEnabled: true,
        datadogEnabled: true,
        coinObservability: { enabled: false },
      }),
    ).toBeNull();
    expect(
      coinObservabilityConfigFor({
        bugReportingEnabled: true,
        datadogEnabled: true,
        coinObservability: undefined,
      }),
    ).toBeNull();
  });
});
