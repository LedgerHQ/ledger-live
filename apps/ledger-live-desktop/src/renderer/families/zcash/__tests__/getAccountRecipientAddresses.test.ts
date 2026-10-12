import { createFixtureAccount } from "@ledgerhq/coin-bitcoin/fixtures/common.fixtures";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { ZcashAccount } from "@ledgerhq/coin-zcash/types/bridge";
import type { ZcashPrivateInfo } from "@ledgerhq/coin-zcash/network/types";
import { getAccountRecipientAddresses } from "../getAccountRecipientAddresses";

const buildZcashAccount = (privateInfo?: Partial<ZcashPrivateInfo>): ZcashAccount =>
  ({
    ...createFixtureAccount(),
    currency: { id: "zcash", family: "zcash" } as CryptoCurrency,
    privateInfo,
  }) as unknown as ZcashAccount;

describe("getAccountRecipientAddresses", () => {
  it("returns the fresh address and the unified shielded address for an account with a shielded address", () => {
    const account = buildZcashAccount({ shieldedAddress: "u1exportedaddress" });

    expect(getAccountRecipientAddresses(account)).toEqual([
      account.freshAddress,
      "u1exportedaddress",
    ]);
  });

  it("returns only the fresh address when the shielded address is null", () => {
    const account = buildZcashAccount({ shieldedAddress: null });

    expect(getAccountRecipientAddresses(account)).toEqual([account.freshAddress]);
  });

  it("returns only the fresh address for an account with no privateInfo at all", () => {
    const account = buildZcashAccount(undefined);

    expect(getAccountRecipientAddresses(account)).toEqual([account.freshAddress]);
  });
});
