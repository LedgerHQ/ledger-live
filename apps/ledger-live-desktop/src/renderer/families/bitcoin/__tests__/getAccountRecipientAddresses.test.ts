import { createFixtureAccount } from "@ledgerhq/coin-bitcoin/fixtures/common.fixtures";
import { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { BitcoinAccount, ZcashAccount } from "@ledgerhq/live-common/families/bitcoin/types";
import type { ZcashPrivateInfo } from "@ledgerhq/coin-zcash/network/types";
import { getAccountRecipientAddresses } from "../getAccountRecipientAddresses";

const baseAccount = createFixtureAccount();

const buildBitcoinAccount = (currencyId = "bitcoin"): BitcoinAccount =>
  ({
    ...baseAccount,
    currency: { id: currencyId } as CryptoCurrency,
  }) as unknown as BitcoinAccount;

const buildZcashAccount = (privateInfo?: Partial<ZcashPrivateInfo>): ZcashAccount =>
  ({
    ...buildBitcoinAccount("zcash"),
    privateInfo,
  }) as unknown as ZcashAccount;

describe("getAccountRecipientAddresses", () => {
  it("returns only the fresh address for a non-zcash bitcoin-family currency", () => {
    const account = buildBitcoinAccount("bitcoin");

    expect(getAccountRecipientAddresses(account)).toEqual([account.freshAddress]);
  });

  it("returns the fresh address and the unified shielded address for a zcash account with a shielded address", () => {
    const account = buildZcashAccount({ shieldedAddress: "u1exportedaddress" });

    expect(getAccountRecipientAddresses(account)).toEqual([
      account.freshAddress,
      "u1exportedaddress",
    ]);
  });

  it("returns only the fresh address for a zcash account whose shielded address is null", () => {
    const account = buildZcashAccount({ shieldedAddress: null });

    expect(getAccountRecipientAddresses(account)).toEqual([account.freshAddress]);
  });

  it("returns only the fresh address for a zcash account with no privateInfo at all", () => {
    const account = { ...buildBitcoinAccount("zcash"), privateInfo: undefined } as ZcashAccount;

    expect(getAccountRecipientAddresses(account)).toEqual([account.freshAddress]);
  });
});
