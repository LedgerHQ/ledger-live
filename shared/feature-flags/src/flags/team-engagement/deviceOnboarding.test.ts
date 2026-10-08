import { deviceOnboarding } from "./deviceOnboarding";

describe("deviceOnboarding", () => {
  it("stays off and does not offer sync", () => {
    expect(deviceOnboarding.parse(undefined)).toEqual({
      enabled: false,
      params: { offerLedgerSync: false },
    });
  });

  it("offers sync when the flag and the param are on", () => {
    expect(deviceOnboarding.parse({ enabled: true, params: { offerLedgerSync: true } })).toEqual({
      enabled: true,
      params: { offerLedgerSync: true },
    });
  });
});
