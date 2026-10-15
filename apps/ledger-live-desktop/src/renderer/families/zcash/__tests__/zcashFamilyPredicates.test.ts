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

describe("zcashFamily.useCustomConfirmAddress", () => {
  it("returns false for a Zcash account when the flag is disabled", () => {
    const account = makeAccount("zcash", { shieldedAddress: "u1abc", ufvk: "uview1test" });
    expect(predicate(account, flags(false))).toBe(false);
  });

  it("returns false for a Zcash account with the flag on but no shielded address", () => {
    expect(predicate(makeAccount("zcash"), flags(true))).toBe(false);
    expect(predicate(makeAccount("zcash", { ufvk: "uview1test" }), flags(true))).toBe(false);
    expect(predicate(makeAccount("zcash", { shieldedAddress: null }), flags(true))).toBe(false);
  });

  it.each(["zcash", "zcash_testnet"])(
    "returns true for a %s account with the flag on and a shielded address present",
    currencyId => {
      const account = makeAccount(currencyId, { shieldedAddress: "u1abc", ufvk: "uview1test" });
      expect(predicate(account, flags(true))).toBe(true);
    },
  );
});
