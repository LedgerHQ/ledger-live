import family from "../index";
import { createFixtureAccount } from "@ledgerhq/coin-bitcoin/fixtures/common.fixtures";
import type { Features } from "@shared/feature-flags";

const makeAccount = (currencyId: string, privateInfo?: object) => ({
  ...createFixtureAccount(),
  currency: { id: currencyId, family: "zcash" },
  ...(privateInfo !== undefined ? { privateInfo } : {}),
});

const flags = (zcashEnabled: boolean): Features =>
  ({ zcashShielded: { enabled: zcashEnabled } }) as unknown as Features;

const predicate = family.useCustomConfirmAddress as (
  account: ReturnType<typeof makeAccount>,
  featureFlags: Features,
) => boolean;

const shielded = { shieldedAddress: "u1abc", ufvk: "uview1test" };

describe("zcashFamily.useCustomConfirmAddress", () => {
  it.each(["zcash", "zcash_testnet"])(
    "returns true for a %s account with the flag on and a shielded address present",
    currencyId => {
      expect(predicate(makeAccount(currencyId, shielded), flags(true))).toBe(true);
    },
  );

  it("returns false when the flag is disabled", () => {
    expect(predicate(makeAccount("zcash", shielded), flags(false))).toBe(false);
  });

  it("returns false with the flag on but no shielded address", () => {
    expect(predicate(makeAccount("zcash"), flags(true))).toBe(false);
    expect(predicate(makeAccount("zcash", { ufvk: "uview1test" }), flags(true))).toBe(false);
  });

  it("keeps the standard confirmation for a Zcash currency the single exchange does not cover", () => {
    expect(predicate(makeAccount("zcash_regtest", shielded), flags(true))).toBe(false);
  });
});
