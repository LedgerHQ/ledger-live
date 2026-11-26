import type { Features } from "@shared/feature-flags";
import { isRecoverInOnboarding } from "./recoverInOnboarding";

function flagWithParams(params: { offerLedgerSync: boolean; recover?: boolean }) {
  return { enabled: true, params } as Features["deviceOnboarding"];
}

describe("isRecoverInOnboarding", () => {
  it("should show Recover when the flag is not loaded", () => {
    expect(isRecoverInOnboarding(null)).toBe(true);
  });

  it("should show Recover when a saved value predates the param", () => {
    expect(isRecoverInOnboarding(flagWithParams({ offerLedgerSync: false }))).toBe(true);
  });

  it("should show Recover when the param is on", () => {
    expect(isRecoverInOnboarding(flagWithParams({ offerLedgerSync: false, recover: true }))).toBe(
      true,
    );
  });

  it("should hide Recover when the param is off", () => {
    expect(isRecoverInOnboarding(flagWithParams({ offerLedgerSync: false, recover: false }))).toBe(
      false,
    );
  });
});
