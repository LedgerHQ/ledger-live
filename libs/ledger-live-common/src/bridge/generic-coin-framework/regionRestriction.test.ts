import type { CurrencyConfig } from "@ledgerhq/coin-module-framework/config";
import { isRegionRestrictedFailure } from "./regionRestriction";

const config = (values: Partial<CurrencyConfig>) => values as CurrencyConfig;

describe("isRegionRestrictedFailure", () => {
  it("recognises the compliance page answering the replayed request", () => {
    expect(
      isRegionRestrictedFailure({ status: 405 }, config({ checkRegionRestriction: true })),
    ).toBe(true);
  });

  it("ignores the same status for a currency the config did not opt in", () => {
    expect(isRegionRestrictedFailure({ status: 405 }, config({}))).toBe(false);
  });

  it("ignores other failures of an opted-in currency", () => {
    const optedIn = config({ checkRegionRestriction: true });

    expect(isRegionRestrictedFailure({ status: 500 }, optedIn)).toBe(false);
    expect(isRegionRestrictedFailure(new Error("network down"), optedIn)).toBe(false);
    expect(isRegionRestrictedFailure(undefined, optedIn)).toBe(false);
  });

  it("ignores a currency with no configuration at all", () => {
    expect(isRegionRestrictedFailure({ status: 405 }, undefined)).toBe(false);
  });
});
